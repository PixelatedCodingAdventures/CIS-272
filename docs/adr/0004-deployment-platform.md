ADR - Deployment Platform

Decision:
We chose OVHcloud as the deployment platform for our Equipment Checkout application. We will use a Virtual Private Server (VPS) running Ubuntu Linux to host our Node.js and Express application with MySQL.

Options Considered:
OVHcloud
Amazon Web Services (AWS)
DigitalOcean

Why We Chose It:
OVHcloud provides affordable VPS hosting and gives us control over our server environment. We can install and configure Node.js, Express, MySQL, and Docker to deploy our application. It also allows us to make our application accessible through a public URL.

What We Are Giving Up:
By choosing OVHcloud VPS hosting, we are responsible for configuring, maintaining, and securing our own server. Other platforms offer more automated deployment and server management features.
