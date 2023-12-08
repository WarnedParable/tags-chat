const http = require('http');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const publicDirectory = path.join(__dirname, '../frontend');

const tags = ['Cars', 'Games', 'Programming'];
// {user: , message: ''}
const chatByTag = {};
initChatByTag();

http.createServer(function (request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const searchParams = url.searchParams;
  const queryParams = {};

  // Конвертация всех параметров в обычный объект
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  if (request.method === 'GET') {
    if (url.pathname === '/') {
      serveStaticFile(response, path.join(publicDirectory, 'index.html'), 'text/html');
    } else {
      const filePath = path.join(publicDirectory, request.url);
      const extname = String(path.extname(filePath)).toLowerCase();

      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        'js': 'text/js'
      };

      const contentType = mimeTypes[extname] || 'application/octet-stream';
      serveStaticFile(response, filePath, contentType);
    }

    if (url.pathname === '/get-message' && !!queryParams.tag) {
      // const a = JSON.stringify(getMessage(queryParams.tag));
      // console.log(JSON.parse(a));
      response.end(JSON.stringify(getMessage(queryParams.tag)));
    }

    if (url.pathname === '/get-tags') {
      response.end(JSON.stringify(tags));
    }
  }

  if (request.method === 'POST') {
    if (url.pathname === '/send-message') {
      let body = '';

      // Получаем данные частями (куски данных приходят в виде потока)
      request.on('data', chunk => {
        body += chunk.toString(); // Преобразуем Buffer в строку
      });
      
      request.on('end', () => {
        // Парсим данные тела запроса
        const parsedData = querystring.parse(body);
        
        request.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        sendMessage(parsedData.message, parsedData.tag, parsedData.user);
        response.end('Ok');
      });
    }
  }
}).listen(3000);

function sendMessage(message, tag, user) {
  chatByTag[tag].push({user, message});
}

function getMessage(tag) {
  return chatByTag[tag];
}

function initChatByTag() {
  for (let i = 0; i < tags.length; i++) {
    chatByTag[tags[i]] = [];
  }
}

function serveStaticFile(res, filePath, contentType) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found\n');
      } else {
        res.writeHead(500);
        res.end(`Sorry, check with the site admin for error: ${error.code}\n`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}