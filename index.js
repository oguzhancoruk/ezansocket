const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const readXlsxFile = require('read-excel-file/node');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

async function getSpecificRow() {
  const currentDate = new Date();
  // Tarih ve saat bilgisini İstanbul'a göre formatlıyoruz
  const istanbulDate = new Date(currentDate.toUTCString() );
  istanbulDate.setHours(istanbulDate.getHours() + 3);
  const formattedDate = `${istanbulDate.getDate()} ${getMonthName(istanbulDate.getMonth())} ${istanbulDate.getFullYear()}`;
  const saat = istanbulDate.getHours().toString().padStart(2, '0');
  const dakika = istanbulDate.getMinutes().toString().padStart(2, '0');
  const sonuc = `${saat}:${dakika}`;
  try {
    const rows = await readXlsxFile('./İstanbul.xlsx');
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

    return { sunuc: "06:10", data: result }; 
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Ayları getiren fonksiyon
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

server.listen(9002, () => {
  console.log('Sunucu 9001 portunda çalışıyor.');
});
