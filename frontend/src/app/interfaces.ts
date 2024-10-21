export interface ErrorResponse {
  status: "error";
  message: string;
}

export interface AuthenticationResponse {
  status: "success";
  rights: string;
  username: string;
  ticket: string;
}

export interface AuthenticationRequest {
  username: string;
  password: string;
}

export interface StatusResponse {
  status: string;
  message: string;
}

export interface JobCheck {
  messages: string[];
}

export interface JobElement {
  position: number;
  job_id: string;
  status: string;
  user: string;
  priority: number;
  timestamp: string;
  job: Options;
}

export interface Jobs {
  [index: number]: {
    id: string;
    status: string;
    user: string;
    priority: number;
    timestamp: string;
    options: Options;
  };
}

export interface Job {
  id: string;
  status: string;
  user: string;
  timestamp: string;
  options: Options;
  [key: string]: any;
}

export interface Options {
  sparkPath: string;
  master: string;
  deployMode: string;
  name: string;
  class: string;
  conf: Configurations;
  executable: string;
}

export interface Configurations {
  [confKey: string]: string | number;
  // spark_executor_instances: number;
  // "spark.executor.cores": number;
  // spark_executor_memory: string;
  // spark_kubernetes_container_image: string;
  // spark_kubernetes_driver_node_selector_kubernetes_io_hostname: string;
  // spark_kubernetes_authenticate_driver_serviceAccountName: string;
}

export interface NewJob {
  username: string;
  status: string;
  options: Options;
  [key: string]: any;
}
