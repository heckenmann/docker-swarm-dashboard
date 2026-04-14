#!/usr/bin/env node
/**
 * E2E Test Runner - starts servers if not running, runs tests, cleanup only if we started servers
 */
const { spawn } = require('child_process');
const http = require('http');
const net = require('net');

const SERVERS = [
  { port: 3000, name: 'Dev Server' },
  { port: 3001, name: 'API Mock' }
];

async function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, 'localhost');
  });
}

async function waitForServers() {
  console.log('Checking if servers are running...');
  const status = await Promise.all(SERVERS.map(s => checkPort(s.port)));
  const allRunning = status.every(s => s);
  
  if (allRunning) {
    console.log('✓ All servers already running');
    return false; // Didn't start servers
  }
  
  console.log('Starting servers...');
  const serversProcess = spawn('yarn', ['start:servers'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Wait for servers to be ready
  console.log('Waiting for servers to be ready...');
  const startTime = Date.now();
  const TIMEOUT = 60000;
  
  while (Date.now() - startTime < TIMEOUT) {
    const status = await Promise.all(SERVERS.map(s => checkPort(s.port)));
    if (status.every(s => s)) {
      console.log('✓ All servers ready');
      return serversProcess; // Return process so we can kill it later
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  throw new Error('Timeout waiting for servers');
}

async function runTests() {
  console.log('Running Cypress tests...');
  return new Promise((resolve, reject) => {
    const cypress = spawn('yarn', ['cy:run'], {
      stdio: 'inherit',
      shell: true
    });
    
    cypress.on('close', (code) => {
      resolve(code);
    });
    
    cypress.on('error', reject);
  });
}

async function main() {
  let serversProcess = null;
  let exitCode = 0;
  
  try {
    serversProcess = await waitForServers();
    exitCode = await runTests();
  } catch (error) {
    console.error('Error:', error.message);
    exitCode = 1;
  } finally {
    // Only kill servers if we started them
    if (serversProcess) {
      console.log('Stopping servers...');
      serversProcess.kill();
    }
  }
  
  process.exit(exitCode);
}

main();
