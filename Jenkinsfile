pipeline {
    agent any

    environment {
        // ─── UPDATE THESE THREE VARIABLES ───────────────────────────────────
        DOCKERHUB_USERNAME = "batsyyy"                    // Your DockerHub username
        IMAGE_NAME         = "cicd-demo"                  // Docker image name
        EC2_HOST           = "YOUR_EC2_PUBLIC_IP"         // e.g. 54.123.45.67
        EC2_USER           = "ubuntu"                     // Default AWS Ubuntu AMI user
        // ────────────────────────────────────────────────────────────────────

        IMAGE_FULL    = "${DOCKERHUB_USERNAME}/${IMAGE_NAME}"
        BUILD_TAG     = "${IMAGE_FULL}:${BUILD_NUMBER}"
        LATEST_TAG    = "${IMAGE_FULL}:latest"
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        // ─────────────────────────────────────────────────────────────────────
        stage('📥 Checkout') {
        // ─────────────────────────────────────────────────────────────────────
            steps {
                echo "🔗 Checking out source from GitHub..."
                checkout scm
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        stage('🧪 Test') {
        // ─────────────────────────────────────────────────────────────────────
            steps {
                echo "🧪 Running tests..."
                sh 'npm test'
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        stage('🐋 Build Docker Image') {
        // ─────────────────────────────────────────────────────────────────────
            steps {
                echo "🐋 Building Docker image: ${BUILD_TAG}"
                sh """
                    docker build \
                        --build-arg BUILD_ID=${BUILD_NUMBER} \
                        -t ${BUILD_TAG} \
                        -t ${LATEST_TAG} \
                        .
                """
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        stage('🚀 Push to DockerHub') {
        // ─────────────────────────────────────────────────────────────────────
            steps {
                echo "🚀 Pushing image to DockerHub..."
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin
                        docker push ${BUILD_TAG}
                        docker push ${LATEST_TAG}
                        docker logout
                    """
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        stage('☁️ Deploy to AWS EC2') {
        // ─────────────────────────────────────────────────────────────────────
            steps {
                echo "☁️ Deploying to AWS EC2 at ${EC2_HOST}..."
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'ec2-ssh-key',
                    keyFileVariable: 'SSH_KEY'
                )]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no \
                            -i ${SSH_KEY} \
                            ${EC2_USER}@${EC2_HOST} << 'DEPLOY'
                            set -e

                            echo "📦 Pulling latest image from DockerHub..."
                            docker pull ${LATEST_TAG}

                            echo "🛑 Stopping old container (if running)..."
                            docker stop cicd-demo || true
                            docker rm   cicd-demo || true

                            echo "▶️  Starting new container..."
                            docker run -d \
                                --name cicd-demo \
                                --restart unless-stopped \
                                -p 80:3000 \
                                -e APP_VERSION=1.0.0 \
                                -e BUILD_ID=${BUILD_NUMBER} \
                                ${LATEST_TAG}

                            echo "✅ Deployment complete!"
                            docker ps | grep cicd-demo
DEPLOY
                    """
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        stage('🔍 Health Check') {
        // ─────────────────────────────────────────────────────────────────────
            steps {
                echo "🔍 Verifying deployment health..."
                sh """
                    sleep 10
                    curl -f http://${EC2_HOST}/health || (echo '❌ Health check failed!' && exit 1)
                    echo '✅ App is live and healthy!'
                """
            }
        }
    }

    post {
        success {
            echo """
╔══════════════════════════════════════════════╗
║  ✅ Pipeline SUCCEEDED — Build #${BUILD_NUMBER}     ║
║  🌐 App URL: http://${EC2_HOST}              ║
╚══════════════════════════════════════════════╝
            """
        }
        failure {
            echo "❌ Pipeline FAILED on build #${BUILD_NUMBER}. Check the logs above."
        }
        always {
            sh "docker rmi ${BUILD_TAG} || true"
            echo "🧹 Cleaned up local Docker image."
        }
    }
}
