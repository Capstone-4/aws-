const express = require('express');
const { Client } = require('ssh2');

const app = express();
const sshConfig = {
  host: '13.209.5.113',
  port: 22,
  username: 'ubuntu',
  privateKey: require('fs').readFileSync('/Users/yoon/Desktop/캡스톤디자인/capstone.pem'),
  passphrase: 'maria_dev'
};

// SSH 연결 함수
function connectSSH() {
  return new Promise((resolve, reject) => {
    const sshClient = new Client();
    sshClient.on('ready', () => {
      console.log('SSH connected');
      resolve(sshClient);
    }).on('error', (error) => {
      console.error('SSH connection error:', error);
      reject(error);
    }).connect(sshConfig);
  });
}

// SSH 명령 실행 함수
function executeCommand(sshClient, command) {
  return new Promise((resolve, reject) => {
    sshClient.exec(command, { pty: { rows: 24, cols: 80 } }, (error, stream) => {
      if (error) {
        console.error('SSH command execution error:', error);
        reject(error);
      } else {
        let output = '';
        stream.on('close', (code, signal) => {
          console.log('SSH command executed successfully');
          resolve(output);
        }).on('data', (data) => {
          output += data.toString();
        }).stderr.on('data', (data) => {
          console.error('SSH command execution error:', data.toString());
          reject(data.toString());
        });
      }
    });
  });
}

// 웹 페이지 렌더링
app.get('/', (req, res) => {
  res.send(`
    <html>
    <body>
      <button onclick="handleClickButton()">Click me</button>

      <script>
        async function handleClickButton() {
          try {
            const response = await fetch('/executeSSHCommand');
            const output = await response.text();
            console.log('File output:', output);

            // 웹 페이지에 출력
            const pre = document.createElement('pre');
            pre.textContent = output;
            document.body.appendChild(pre);
          } catch (error) {
            console.error('Error:', error);
          }
        }
      </script>
    </body>
    </html>
  `);
});

// SSH 명령 실행 엔드포인트
app.get('/executeSSHCommand', async (req, res) => {
  try {
    const sshClient = await connectSSH();
    const command = 'docker exec -it sandbox-hdp cat /home/maria_dev/mapreduce/data/ml-latest/README.txt';
    const output = await executeCommand(sshClient, command);
    sshClient.end();
    res.send(output);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  }
});

// 웹 서버 시작
app.listen(3000, () => {
  console.log('Web server started on port 3000');
});