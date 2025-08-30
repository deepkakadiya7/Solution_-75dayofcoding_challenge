const WebSocket = require('ws');
const EventEmitter = require('events');
const logger = require('../utils/logger');
const axios = require('axios');

/**
 * IoT Integration Service
 * Handles real-time data streaming from IoT devices and automated milestone verification
 */
class IoTIntegrationService extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map();
    this.deviceData = new Map();
    this.verificationRules = new Map();
    this.isRunning = false;
    this.reconnectInterval = 5000;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize IoT service with device configurations
   */
  async initialize(deviceConfigs) {
    try {
      logger.info('Initializing IoT Integration Service', { deviceCount: deviceConfigs.length });
      
      for (const config of deviceConfigs) {
        await this.addDevice(config);
      }
      
      this.isRunning = true;
      this.startHealthMonitoring();
      
      logger.info('IoT Integration Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize IoT service', { error: error.message });
      throw error;
    }
  }

  /**
   * Add a new IoT device for monitoring
   */
  async addDevice(config) {
    const {
      deviceId,
      deviceType,
      endpoint,
      apiKey,
      verificationRules,
      updateInterval = 5000
    } = config;

    try {
      // Create WebSocket connection for real-time data
      const ws = new WebSocket(endpoint);
      
      ws.on('open', () => {
        logger.info('IoT device connected', { deviceId, endpoint });
        this.connections.set(deviceId, { ws, config, status: 'connected' });
        
        // Authenticate with device
        ws.send(JSON.stringify({
          type: 'auth',
          apiKey,
          deviceId
        }));
      });

      ws.on('message', (data) => {
        this.handleDeviceData(deviceId, JSON.parse(data));
      });

      ws.on('close', () => {
        logger.warn('IoT device disconnected', { deviceId });
        this.connections.set(deviceId, { ws, config, status: 'disconnected' });
        this.scheduleReconnect(deviceId);
      });

      ws.on('error', (error) => {
        logger.error('IoT device connection error', { deviceId, error: error.message });
        this.connections.set(deviceId, { ws, config, status: 'error' });
      });

      // Store verification rules for this device
      this.verificationRules.set(deviceId, verificationRules);
      
      // Start polling for data if WebSocket fails
      this.startPolling(deviceId, config);
      
      logger.info('IoT device added successfully', { deviceId, deviceType });
      
    } catch (error) {
      logger.error('Failed to add IoT device', { deviceId, error: error.message });
      throw error;
    }
  }

  /**
   * Handle incoming device data and trigger verification
   */
  handleDeviceData(deviceId, data) {
    try {
      const timestamp = new Date();
      const deviceInfo = this.connections.get(deviceId);
      
      if (!deviceInfo) {
        logger.warn('Received data from unknown device', { deviceId });
        return;
      }

      // Store latest data
      this.deviceData.set(deviceId, {
        ...data,
        timestamp,
        deviceId
      });

      // Check if data meets verification criteria
      this.checkVerificationCriteria(deviceId, data);
      
      // Emit data event for real-time processing
      this.emit('deviceData', { deviceId, data, timestamp });
      
      logger.debug('Device data processed', { deviceId, dataType: data.type });
      
    } catch (error) {
      logger.error('Error processing device data', { deviceId, error: error.message });
    }
  }

  /**
   * Check if device data meets milestone verification criteria
   */
  async checkVerificationCriteria(deviceId, data) {
    try {
      const rules = this.verificationRules.get(deviceId);
      if (!rules) return;

      for (const rule of rules) {
        const { milestoneId, targetValue, metric, operator = 'gte' } = rule;
        
        let meetsCriteria = false;
        const actualValue = data[metric] || 0;

        switch (operator) {
          case 'gte':
            meetsCriteria = actualValue >= targetValue;
            break;
          case 'lte':
            meetsCriteria = actualValue <= targetValue;
            break;
          case 'eq':
            meetsCriteria = actualValue === targetValue;
            break;
          case 'gt':
            meetsCriteria = actualValue > targetValue;
            break;
          case 'lt':
            meetsCriteria = actualValue < targetValue;
            break;
        }

        if (meetsCriteria) {
          logger.info('Milestone verification criteria met', {
            deviceId,
            milestoneId,
            targetValue,
            actualValue,
            metric
          });

          // Emit verification event
          this.emit('milestoneVerification', {
            deviceId,
            milestoneId,
            actualValue,
            targetValue,
            metric,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      logger.error('Error checking verification criteria', { deviceId, error: error.message });
    }
  }

  /**
   * Start polling for devices that don't support WebSocket
   */
  startPolling(deviceId, config) {
    const { endpoint, apiKey, updateInterval } = config;
    
    setInterval(async () => {
      try {
        const response = await axios.get(`${endpoint}/data`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: 10000
        });
        
        this.handleDeviceData(deviceId, response.data);
      } catch (error) {
        logger.debug('Polling failed for device', { deviceId, error: error.message });
      }
    }, updateInterval);
  }

  /**
   * Schedule reconnection for disconnected devices
   */
  scheduleReconnect(deviceId) {
    const deviceInfo = this.connections.get(deviceId);
    if (!deviceInfo || deviceInfo.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    deviceInfo.reconnectAttempts = (deviceInfo.reconnectAttempts || 0) + 1;
    
    setTimeout(() => {
      this.reconnectDevice(deviceId);
    }, this.reconnectInterval * deviceInfo.reconnectAttempts);
  }

  /**
   * Reconnect to a disconnected device
   */
  async reconnectDevice(deviceId) {
    try {
      const deviceInfo = this.connections.get(deviceId);
      if (!deviceInfo) return;

      logger.info('Attempting to reconnect device', { deviceId });
      
      // Close existing connection
      if (deviceInfo.ws) {
        deviceInfo.ws.close();
      }
      
      // Re-add device
      await this.addDevice(deviceInfo.config);
      
    } catch (error) {
      logger.error('Failed to reconnect device', { deviceId, error: error.message });
    }
  }

  /**
   * Start health monitoring for all devices
   */
  startHealthMonitoring() {
    setInterval(() => {
      for (const [deviceId, deviceInfo] of this.connections) {
        const { status, lastHeartbeat } = deviceInfo;
        
        // Check if device is responsive
        if (status === 'connected' && lastHeartbeat) {
          const timeSinceHeartbeat = Date.now() - lastHeartbeat;
          if (timeSinceHeartbeat > 60000) { // 1 minute
            logger.warn('Device heartbeat timeout', { deviceId, timeSinceHeartbeat });
            deviceInfo.status = 'timeout';
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get device status and health information
   */
  getDeviceStatus(deviceId) {
    const deviceInfo = this.connections.get(deviceId);
    if (!deviceInfo) return null;

    const latestData = this.deviceData.get(deviceId);
    
    return {
      deviceId,
      status: deviceInfo.status,
      config: deviceInfo.config,
      lastData: latestData,
      uptime: deviceInfo.uptime,
      reconnectAttempts: deviceInfo.reconnectAttempts || 0
    };
  }

  /**
   * Get all device statuses
   */
  getAllDeviceStatuses() {
    const statuses = [];
    for (const [deviceId] of this.connections) {
      statuses.push(this.getDeviceStatus(deviceId));
    }
    return statuses;
  }

  /**
   * Stop IoT service and close all connections
   */
  async stop() {
    this.isRunning = false;
    
    for (const [deviceId, deviceInfo] of this.connections) {
      if (deviceInfo.ws) {
        deviceInfo.ws.close();
      }
    }
    
    this.connections.clear();
    this.deviceData.clear();
    
    logger.info('IoT Integration Service stopped');
  }
}

module.exports = new IoTIntegrationService();
