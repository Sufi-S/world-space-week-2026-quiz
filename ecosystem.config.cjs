module.exports = {
  apps: [{
    name: 'space-quiz',
    cwd: './server',
    script: 'src/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    node_args: '--experimental-vm-modules',
    watch: false,
    max_memory_restart: '300M',
    error_file: '../logs/err.log',
    out_file: '../logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
};
