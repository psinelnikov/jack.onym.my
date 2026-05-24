pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 10, unit: 'MINUTES')
    }

    triggers {
        githubPush()
    }

    environment {
        SITE_DIR = '/home/pavel/jack.onym.my'
        SITE_URL = 'https://jack.onym.my'
    }

    stages {
        stage('Pull') {
            steps {
                sh '''
                    cd ${SITE_DIR}
                    git fetch origin
                    git reset --hard origin/master
                    echo "✅ Pulled commit: $(git rev-parse --short HEAD)"
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                    cd ${SITE_DIR}
                    export NVM_DIR="/var/lib/jenkins/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use 22
                    echo "📦 Installing dependencies..."
                    npm ci
                    echo "🔨 Building bundle..."
                    npm run build
                    echo "✅ Build complete — dist/bundle.js: $(wc -c < dist/bundle.js) bytes"
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${SITE_URL})
                    if [ "$STATUS" = "200" ]; then
                        echo "✅ Site is live at ${SITE_URL} (HTTP ${STATUS})"
                    else
                        echo "⚠️  Health check returned HTTP ${STATUS}"
                    fi
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 jack.onym.my deployed successfully"
        }
        failure {
            echo "❌ Deployment failed — check logs above"
        }
    }
}
