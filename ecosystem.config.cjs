module.exports = {
  apps: [
    {
      name: "tbgs-backend",
      cwd: "./back-end",
      script: "./dist/server.js",
      env: {
        NODE_ENV: "production",
      },
      out_file: "../logs/backend-out.log",
      error_file: "../logs/backend-err.log",
      time: true,
    },
    {
      name: "tbgs-frontend",
      cwd: "./front-end",
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      out_file: "../logs/frontend-out.log",
      error_file: "../logs/frontend-err.log",
      time: true,
    },
  ],
};