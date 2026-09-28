let simulateFailures = false;

export const setSimulateFailures = (enable: boolean): void => {
  simulateFailures = enable;
};

export const isSimulateFailures = (): boolean => simulateFailures;

export const delay = async (minMs = 300, maxMs = 700): Promise<void> => {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise((resolve) => setTimeout(resolve, ms));

  if (simulateFailures && Math.random() < 0.05) {
    throw {
      status: 500,
      message: 'Simulated network or server failure (Mock Testing)',
    };
  }
};
