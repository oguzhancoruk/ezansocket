  const express = require('express');
  const http = require('http');
  const WebSocket = require('ws');
  const readXlsxFile = require('read-excel-file/node');

  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  async function getSpecificRow() {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()} ${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;
    const path = './İstanbul.xlsx'; // Specify the file's directory
    const saat = currentDate.getHours().toString().padStart(2, '0'); // Saati alırken 2 basamaklı olacak şekilde düzenler
    const dakika = currentDate.getMinutes().toString().padStart(2, '0'); // Dakikayı alırken 2 basamaklı olacak şekilde düzenler
    const sonuc = `${saat}:${dakika}`;
    try {
      const rows = await readXlsxFile(path);
      const specificRows = rows.filter(row => row[0].includes(formattedDate));
      const remainingRows = specificRows.map(row => row.slice(2));
  
      const allDayDictionaries = remainingRows.map(row => ({
        "İmsak": row[0],
        "Güneş": row[1],
        "Öğle": row[2],
        "İkindi": row[3],
        "Akşam": row[4],
        "Yatsı": row[5]
      }));
  
      const result = allDayDictionaries.map(item => {
        return Object.keys(item).map(vakit => ({
          saat: item[vakit],
          vakit: vakit
        }));
      }).flat();
  
      return { sunuc: sonuc, data: result }; // Burada sunuc keyini ekledik
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  

  function getMonthName(monthIndex) {
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    return months[monthIndex];
  }

  wss.on('connection', (ws) => {
    console.log('Yeni bir bağlantı kuruldu.');

    ws.on('message', (message) => {
      console.log(`Alınan mesaj: ${message}`);
    });

    const interval = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          const data = await getSpecificRow();
          ws.send(JSON.stringify({ success: true, result: data }));
        } catch (error) {
          console.error("Veri alınamadı:", error);
        }
      }
    }, 1500);

    ws.on('close', () => {
      console.log('Bağlantı kesildi.');
      clearInterval(interval);
    });
  });

  server.listen(9001, () => {
    console.log('Sunucu 9001 portunda çalışıyor.');
  });
