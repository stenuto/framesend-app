import { EventEmitter } from 'events';

/**
 * Progress tracking for multi-stage encoding pipeline
 * Calculates weighted progress across all stages
 */
export class ProgressTracker extends EventEmitter {
  constructor(stageWeights) {
    super();
    
    this.stageWeights = stageWeights;
    this.stages = {};
    
    // Initialize all stages
    Object.keys(stageWeights).forEach(stage => {
      this.stages[stage] = {
        weight: stageWeights[stage],
        progress: 0,
        status: 'pending',
      };
    });
    
    this.globalProgress = 0;
    this.maxProgressReached = 0; // Track the maximum progress ever reached
  }

  /**
   * Start a stage
   * @param {string} stageName - Name of the stage
   */
  startStage(stageName) {
    if (!this.stages[stageName]) {
      throw new Error(`Unknown stage: ${stageName}`);
    }
    
    this.stages[stageName].status = 'active';
    this.stages[stageName].startTime = Date.now();
    
    this._emitProgress(stageName);
  }

  /**
   * Update progress for a stage
   * @param {string} stageName - Name of the stage
   * @param {number} progress - Progress value (0-1)
   */
  updateStage(stageName, progress) {
    if (!this.stages[stageName]) {
      throw new Error(`Unknown stage: ${stageName}`);
    }
    
    this.stages[stageName].progress = Math.min(Math.max(progress, 0), 1);
    this._calculateGlobalProgress();
    this._emitProgress(stageName);
  }

  /**
   * Complete a stage
   * @param {string} stageName - Name of the stage
   */
  completeStage(stageName) {
    if (!this.stages[stageName]) {
      throw new Error(`Unknown stage: ${stageName}`);
    }
    
    this.stages[stageName].progress = 1;
    this.stages[stageName].status = 'complete';
    this.stages[stageName].duration = Date.now() - this.stages[stageName].startTime;
    
    // Ensure all previous stages are also marked as complete
    // This prevents progress from going backwards when weights are recalculated
    const stageNames = Object.keys(this.stageWeights);
    const currentStageIndex = stageNames.indexOf(stageName);
    
    for (let i = 0; i <= currentStageIndex; i++) {
      const stage = this.stages[stageNames[i]];
      if (stage.status !== 'complete') {
        stage.progress = 1;
        stage.status = 'complete';
      }
    }
    
    this._calculateGlobalProgress();
    this._emitProgress(stageName);
  }

  /**
   * Calculate global progress from all stages
   * @private
   */
  _calculateGlobalProgress() {
    let totalProgress = 0;
    
    Object.values(this.stages).forEach(stage => {
      totalProgress += stage.progress * stage.weight;
    });
    
    // Calculate new progress
    const newProgress = Math.min(totalProgress, 1);
    
    // Ensure progress never goes backwards
    if (newProgress > this.maxProgressReached) {
      this.globalProgress = newProgress;
      this.maxProgressReached = newProgress;
    } else {
      this.globalProgress = this.maxProgressReached;
    }
  }

  /**
   * Emit progress update
   * @private
   */
  _emitProgress(currentStage) {
    const progressData = {
      global: this.globalProgress,
      currentStage: currentStage,
      stages: this._getStagesInfo(),
      details: this._getProgressDetails(),
    };
    
    this.emit('update', progressData);
  }

  /**
   * Get simplified stage information
   * @private
   */
  _getStagesInfo() {
    const info = {};
    
    Object.entries(this.stages).forEach(([name, stage]) => {
      info[name] = {
        progress: stage.progress,
        status: stage.status,
        completed: stage.status === 'complete',
      };
    });
    
    return info;
  }

  /**
   * Get detailed progress information
   * @private
   */
  _getProgressDetails() {
    const completed = Object.values(this.stages).filter(s => s.status === 'complete').length;
    const total = Object.keys(this.stages).length;
    const activeStage = Object.entries(this.stages).find(([, s]) => s.status === 'active');
    
    const details = {
      completedStages: completed,
      totalStages: total,
      percentage: Math.round(this.globalProgress * 100),
      activeStage: activeStage ? activeStage[0] : null,
      remainingStages: total - completed,
    };
    
    // Add rendition-specific details if encoding
    if (this.currentRendition) {
      details.currentRendition = this.currentRendition;
      details.renditionProgress = this.renditionProgress;
    }
    
    return details;
  }

  /**
   * Reset all progress
   */
  reset() {
    Object.keys(this.stages).forEach(stage => {
      this.stages[stage].progress = 0;
      this.stages[stage].status = 'pending';
      this.stages[stage].startTime = null;
      this.stages[stage].duration = null;
    });
    
    this.globalProgress = 0;
    this.maxProgressReached = 0;
    this.emit('reset');
  }

  /**
   * Get current progress state
   */
  getState() {
    return {
      global: this.globalProgress,
      stages: this._getStagesInfo(),
      details: this._getProgressDetails(),
    };
  }
}