export const getMcpTool = (stepName: string): string => {
  const map: Record<string, string> = {
    "Get latest Ubuntu AMI": "get-latest-ubuntu-ami",
    "Discover subnets in default VPC": "list-subnets",
    "Create EC2 Key Pair": "create-key-pair",
    "Create new EC2 instance": "create-ec2-instance",
  };
  return map[stepName] || "unknown-tool";
};

export const getDependsOn = (stepId: string): string[] => {
  const map: Record<string, string[]> = {
    "step-create-ec2-instance": [
      "step-get-ubuntu-ami",
      "step-discover-subnets",
      "step-create-key-pair",
    ],
  };
  return map[stepId] || [];
};