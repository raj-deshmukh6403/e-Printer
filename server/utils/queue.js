// utils/queue.js

const { PRINT_STATUS } = require('./constants');
const PrintRequest = require('../models/PrintRequest');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// Queue settings
const QUEUE_SETTINGS = {
  MAX_CONCURRENT_JOBS: 3,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000,
  JOB_TIMEOUT: 120000 // 2 minutes
};

class PrintQueue {
  constructor() {
    this.queue = [];
    this.processing = [];
    this.maxConcurrent = QUEUE_SETTINGS.MAX_CONCURRENT_JOBS;
    this.retryAttempts = QUEUE_SETTINGS.RETRY_ATTEMPTS;
    this.retryDelay = QUEUE_SETTINGS.RETRY_DELAY;
    this.jobTimeout = QUEUE_SETTINGS.JOB_TIMEOUT;
    
    // Start processing queue
    this.processQueue();
  }

  async addJob(job) {
    try {
      const queueJob = {
        id: job.printRequestId,
        priority: job.priority || 'normal',
        data: job,
        attempts: 0,
        createdAt: new Date(),
        status: 'queued'
      };

      if (queueJob.priority === 'high') {
        this.queue.unshift(queueJob);
      } else {
        this.queue.push(queueJob);
      }

      await PrintRequest.findByIdAndUpdate(job.printRequestId, {
        status: PRINT_STATUS.IN_QUEUE,
        queuePosition: this.getQueuePosition(job.printRequestId)
      });

      console.log(`Job ${job.printRequestId} added to queue`);
      return true;
    } catch (error) {
      console.error('Error adding job to queue:', error);
      return false;
    }
  }

  async removeJob(jobId) {
    try {
      this.queue = this.queue.filter(job => job.id !== jobId);
      this.processing = this.processing.filter(job => job.id !== jobId);
      await this.updateQueuePositions();
      console.log(`Job ${jobId} removed from queue`);
      return true;
    } catch (error) {
      console.error('Error removing job from queue:', error);
      return false;
    }
  }

  getQueuePosition(jobId) {
    const index = this.queue.findIndex(job => job.id === jobId);
    return index !== -1 ? index + 1 : 0;
  }

  getQueueLength() {
    return this.queue.length + this.processing.length;
  }

  getQueueStatus() {
    return {
      totalJobs: this.queue.length + this.processing.length,
      waitingJobs: this.queue.length,
      processingJobs: this.processing.length,
      maxConcurrent: this.maxConcurrent
    };
  }

  async processQueue() {
    setInterval(async () => {
      if (this.queue.length > 0 && this.processing.length < this.maxConcurrent) {
        const job = this.queue.shift();
        if (job) {
          await this.processJob(job);
        }
      }
    }, 1000);
  }

  async processJob(job) {
    try {
      this.processing.push(job);
      job.status = 'processing';
      job.startedAt = new Date();

      await PrintRequest.findByIdAndUpdate(job.id, {
        status: PRINT_STATUS.IN_PROCESS,
        processingStartedAt: new Date()
      });

      await this.notifyJobStatus(job, 'processing');

      const timeoutId = setTimeout(async () => {
        await this.handleJobTimeout(job);
      }, this.jobTimeout);

      await this.executeJob(job);
      clearTimeout(timeoutId);
      await this.handleJobSuccess(job);

    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      await this.handleJobError(job, error);
    }
  }

  async executeJob(job) {
    const processingTime = Math.random() * 30000 + 10000;
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Job ${job.id} processed successfully`);
        resolve();
      }, processingTime);
    });
  }

  async handleJobSuccess(job) {
    try {
      this.processing = this.processing.filter(p => p.id !== job.id);

      await PrintRequest.findByIdAndUpdate(job.id, {
        status: PRINT_STATUS.COMPLETED,
        completedAt: new Date(),
        processingTime: new Date() - job.startedAt
      });

      await this.notifyJobStatus(job, 'completed');
      await this.updateQueuePositions();

      console.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`Error handling job success for ${job.id}:`, error);
    }
  }

  async handleJobError(job, error) {
    try {
      job.attempts += 1;
      job.lastError = error.message;

      this.processing = this.processing.filter(p => p.id !== job.id);

      if (job.attempts < this.retryAttempts) {
        setTimeout(() => {
          console.log(`Retrying job ${job.id} (attempt ${job.attempts + 1})`);
          this.queue.push(job);
        }, this.retryDelay);

        await PrintRequest.findByIdAndUpdate(job.id, {
          status: PRINT_STATUS.IN_QUEUE,
          error: error.message,
          retryAttempt: job.attempts
        });
      } else {
        await PrintRequest.findByIdAndUpdate(job.id, {
          status: PRINT_STATUS.FAILED,
          error: error.message,
          failedAt: new Date()
        });

        await this.notifyJobStatus(job, 'failed');
      }

      await this.updateQueuePositions();

    } catch (err) {
      console.error(`Error handling job error for ${job.id}:`, err);
    }
  }

  async handleJobTimeout(job) {
    console.log(`Job ${job.id} timed out`);
    await this.handleJobError(job, new Error('Job processing timeout'));
  }

  async updateQueuePositions() {
    try {
      const updatePromises = this.queue.map((job, index) => {
        return PrintRequest.findByIdAndUpdate(job.id, {
          queuePosition: index + 1
        });
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating queue positions:', error);
    }
  }

  async notifyJobStatus(job, status) {
    try {
      const printRequest = await PrintRequest.findById(job.id).populate('userId');
      
      if (!printRequest) return;

      const user = printRequest.userId;
      const statusMessages = {
        processing: 'Your print job is now being processed',
        completed: 'Your print job has been completed and is ready for pickup',
        failed: 'Your print job has failed. Please contact support'
      };

      // Send email notification
      await emailService.sendPrintStatusEmail(user.email, {
        userName: user.username,
        uniqueId: printRequest.uniqueId,
        status: status,
        message: statusMessages[status],
        documentName: printRequest.documentName
      });

      // Send SMS notification
      await smsService.sendStatusSMS(user.whatsappNumber, {
        userName: user.username,
        uniqueId: printRequest.uniqueId,
        status: status,
        message: statusMessages[status]
      });

    } catch (error) {
      console.error('Error sending job status notification:', error);
    }
  }
}

// Create singleton instance
const printQueue = new PrintQueue();

module.exports = printQueue;