export interface HyperparamConfig {
  epochs: number;
  lr: number;
  batch_size: number;
  neurons: number[];
  T: number;
  vth: number;
  beta: number;
  model_type: "LIF" | "IF";
  optimizer: "Adam" | "SGD";
}

export interface EpochEvent {
  epoch: number;
  total_epochs: number;
  loss: number;
  acc: number;
}

export interface LogEvent {
  log: string;
}

export interface DoneEvent {
  done: true;
  test_accuracy: number;
  history: Array<{ epoch: number; loss: number; acc: number }>;
}

export type TrainingEvent = EpochEvent | LogEvent | DoneEvent;
