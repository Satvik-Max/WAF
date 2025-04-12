
import * as tf from '@tensorflow/tfjs';

export interface TrainingData {
  features: number[][];
  labels: number[][];
}

export interface PredictionResult {
  threatScore: number;
  attackLikelihood: Record<string, number>;
  anomalyScore: number;
}

class SecurityMLModel {
  private model: tf.LayersModel | null = null;
  private isModelReady: boolean = false;
  private isTraining: boolean = false;
  
  constructor() {
    this.initModel();
  }
  
  private async initModel() {
    try {
      // Create a sequential model
      const model = tf.sequential();
      
      // Add layers to the model
      model.add(tf.layers.dense({
        inputShape: [10], // Input features: request count, attack types, unique IPs, etc.
        units: 16,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 4,
        activation: 'softmax' // Output probabilities for different threat levels
      }));
      
      // Compile the model
      model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
      
      this.model = model;
      this.isModelReady = true;
      console.log('Security ML model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize security ML model:', error);
    }
  }
  
  // Extract features from request logs
  private extractFeatures(logs: any[]): number[] {
    if (!logs || logs.length === 0) return new Array(10).fill(0);
    
    // Count of requests
    const requestCount = logs.length;
    
    // Count of blocked requests
    const blockedCount = logs.filter(log => log.status === 'blocked').length;
    
    // Count of unique IPs
    const uniqueIPs = new Set(logs.map(log => log.ipAddress)).size;
    
    // Count of different attack types
    const attackTypes = new Set(
      logs.filter(log => log.attackType).map(log => log.attackType)
    ).size;
    
    // Count of SQL injection attempts
    const sqlInjectionCount = logs.filter(log => 
      log.attackType === 'SQL_INJECTION'
    ).length;
    
    // Count of XSS attempts
    const xssCount = logs.filter(log => 
      log.attackType === 'XSS'
    ).length;
    
    // Count of path traversal attempts
    const pathTraversalCount = logs.filter(log => 
      log.attackType === 'PATH_TRAVERSAL'
    ).length;
    
    // Rate of attacks (attacks / total requests)
    const attackRate = logs.filter(log => log.attackType).length / requestCount;
    
    // Count of unique countries
    const uniqueCountries = new Set(
      logs.filter(log => log.country).map(log => log.country)
    ).size;
    
    // Average time between requests (in seconds)
    let avgTimeBetweenRequests = 0;
    if (logs.length > 1) {
      const sortedLogs = [...logs].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      let totalTime = 0;
      for (let i = 1; i < sortedLogs.length; i++) {
        const timeDiff = new Date(sortedLogs[i].timestamp).getTime() - 
                         new Date(sortedLogs[i-1].timestamp).getTime();
        totalTime += timeDiff;
      }
      
      avgTimeBetweenRequests = totalTime / (sortedLogs.length - 1) / 1000; // in seconds
    }
    
    return [
      requestCount / 100, // Normalize by dividing by expected max
      blockedCount / 50,
      uniqueIPs / 20,
      attackTypes / 5,
      sqlInjectionCount / 10,
      xssCount / 10,
      pathTraversalCount / 10,
      attackRate,
      uniqueCountries / 10,
      Math.min(avgTimeBetweenRequests / 60, 1) // Cap at 1 (60 seconds)
    ];
  }
  
  // Train the model with historical data
  async trainModel(trainingData: TrainingData): Promise<void> {
    if (!this.model || this.isTraining) return;
    
    try {
      this.isTraining = true;
      
      const xs = tf.tensor2d(trainingData.features);
      const ys = tf.tensor2d(trainingData.labels);
      
      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`);
          }
        }
      });
      
      xs.dispose();
      ys.dispose();
      
      console.log('Model training completed');
    } catch (error) {
      console.error('Error training model:', error);
    } finally {
      this.isTraining = false;
    }
  }
  
  // Predict threat level based on current logs
  async predictThreat(logs: any[]): Promise<PredictionResult> {
    if (!this.model || !this.isModelReady) {
      return { 
        threatScore: this.fallbackThreatScore(logs),
        attackLikelihood: this.fallbackAttackLikelihood(logs),
        anomalyScore: 0
      };
    }
    
    try {
      const features = this.extractFeatures(logs);
      const inputTensor = tf.tensor2d([features]);
      
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const predictionData = await prediction.data();
      
      // Convert prediction to threat score and attack likelihoods
      const threatScore = Math.round((predictionData[2] * 0.6 + predictionData[3] * 0.4) * 100);
      
      const attackLikelihood = {
        'SQL_INJECTION': features[4] * 0.7 + Math.random() * 0.3,
        'XSS': features[5] * 0.7 + Math.random() * 0.3,
        'PATH_TRAVERSAL': features[6] * 0.7 + Math.random() * 0.3,
        'DDOS': features[0] * features[9] * 0.7 + Math.random() * 0.3,
      };
      
      // Calculate anomaly score based on deviation from expected patterns
      const anomalyScore = Math.min(
        (Math.abs(features[7] - 0.1) + Math.abs(features[9] - 0.5)) * 50, 
        100
      );
      
      // Clean up tensors to prevent memory leaks
      inputTensor.dispose();
      prediction.dispose();
      
      return {
        threatScore,
        attackLikelihood,
        anomalyScore
      };
    } catch (error) {
      console.error('Error predicting threat:', error);
      return { 
        threatScore: this.fallbackThreatScore(logs),
        attackLikelihood: this.fallbackAttackLikelihood(logs),
        anomalyScore: 0
      };
    }
  }
  
  // Generate training data from historical logs
  generateTrainingData(historicalLogs: any[]): TrainingData {
    const features: number[][] = [];
    const labels: number[][] = [];
    
    // Simulate creating batches of logs and their corresponding labels
    for (let i = 0; i < historicalLogs.length; i += 50) {
      const logBatch = historicalLogs.slice(i, i + 50);
      if (logBatch.length < 10) continue; // Skip small batches
      
      const featureVector = this.extractFeatures(logBatch);
      features.push(featureVector);
      
      // Create labels - one-hot encoding for 4 threat levels
      // [minimal, low, medium, high]
      const blockedRatio = logBatch.filter(log => log.status === 'blocked').length / logBatch.length;
      const attackTypesCount = new Set(logBatch.filter(log => log.attackType).map(log => log.attackType)).size;
      
      if (blockedRatio > 0.3 && attackTypesCount >= 3) {
        labels.push([0, 0, 0, 1]); // High threat
      } else if (blockedRatio > 0.2 || attackTypesCount >= 2) {
        labels.push([0, 0, 1, 0]); // Medium threat
      } else if (blockedRatio > 0.1 || attackTypesCount >= 1) {
        labels.push([0, 1, 0, 0]); // Low threat
      } else {
        labels.push([1, 0, 0, 0]); // Minimal threat
      }
    }
    
    return { features, labels };
  }
  
  // Fallback method when model isn't ready
  private fallbackThreatScore(logs: any[]): number {
    if (!logs || logs.length === 0) return 0;
    
    const blockedCount = logs.filter(log => log.status === 'blocked').length;
    const attackTypeCount = new Set(
      logs.filter(log => log.attackType).map(log => log.attackType)
    ).size;
    
    return Math.min(
      Math.round((blockedCount / logs.length) * 70 + attackTypeCount * 10),
      100
    );
  }
  
  // Fallback attack likelihood calculation
  private fallbackAttackLikelihood(logs: any[]): Record<string, number> {
    if (!logs || logs.length === 0) {
      return {
        'SQL_INJECTION': 0,
        'XSS': 0,
        'PATH_TRAVERSAL': 0,
        'DDOS': 0
      };
    }
    
    const attackCounts: Record<string, number> = {};
    logs.forEach(log => {
      if (log.attackType) {
        attackCounts[log.attackType] = (attackCounts[log.attackType] || 0) + 1;
      }
    });
    
    const total = logs.length;
    return {
      'SQL_INJECTION': attackCounts['SQL_INJECTION'] ? attackCounts['SQL_INJECTION'] / total : 0,
      'XSS': attackCounts['XSS'] ? attackCounts['XSS'] / total : 0,
      'PATH_TRAVERSAL': attackCounts['PATH_TRAVERSAL'] ? attackCounts['PATH_TRAVERSAL'] / total : 0,
      'DDOS': attackCounts['DDOS'] ? attackCounts['DDOS'] / total : 0
    };
  }
  
  // Export the model for later use
  async exportModel(): Promise<tf.io.SaveResult> {
    if (!this.model) throw new Error('No model to export');
    return await this.model.save('localstorage://waf-security-model');
  }
  
  // Load a previously saved model
  async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://waf-security-model');
      this.isModelReady = true;
      console.log('Loaded security model from storage');
    } catch (error) {
      console.error('Failed to load model from storage:', error);
      this.initModel(); // Fall back to creating a new model
    }
  }
  
  // Check if model is ready
  isReady(): boolean {
    return this.isModelReady;
  }
}

// Create singleton instance
const securityMLModel = new SecurityMLModel();
export default securityMLModel;