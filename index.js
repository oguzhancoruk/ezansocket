const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const readXlsxFile = require('read-excel-file/node');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const data = require("./data/istanbul.json")






function ezandurum() {
  const vakitler = ["İmsak", "Güneş", "Öğle", 'İkindi', 'Akşam', "Yatsı"]
  const currentDate = new Date();
  const istanbulDate = new Date(currentDate.toUTCString());
  const formattedDate = `${formatTwoDigitNumber(istanbulDate.getDate())} ${getMonthName(istanbulDate.getMonth())} ${istanbulDate.getFullYear()}`;
  istanbulDate.setHours(istanbulDate.getHours() );
  // const formattedDate = `${istanbulDate.getDate()} ${getMonthName(istanbulDate.getMonth())} ${istanbulDate.getFullYear()}`;
  const saat = istanbulDate.getHours();
  const dakika = istanbulDate.getMinutes();
  let ezandurum = [];
  data.map(res => {

    if (formattedDate === res.Tarih) {
      let ezanDurumListesi = []; // Her bir ezan zamanı için durum listesi oluşturuluyor
      vakitler.map(res1 => {
        var parts = res[res1].split(":");
        var liveHours = parseInt(parts[0], 10);
        var liveMinutes = parseInt(parts[1], 10)
        var liveTotalMinutes = liveHours * 60 + liveMinutes;
        var currentTotalMinutes = saat * 60 + dakika;
        var difference = (currentTotalMinutes-liveTotalMinutes);
     /*    console.log("a1",liveTotalMinutes)
        console.log("b1",currentTotalMinutes)
        console.log("dif",difference) */
        console.log("live",liveHours+":"+liveMinutes)
        console.log("current",saat+":"+dakika)
        console.log("DİF",difference )
        if (difference >= 0 && difference <= 10) {
          
         // console.log(difference, "Ezan Okunuyor");
          ezanDurumListesi.push("Ezan Okunuyor"); // Ezan okunuyorsa listeye ekleniyor
        }
        else {
          if (difference > 11) {
            ezanDurumListesi.push("Ezan Okundu"); // Ezan okunmadıysa listeye ekleniyor
            //console.log(difference, "Ezan Okundu");
          }
        }
      });
      ezandurum.push(ezanDurumListesi); // Her bir vakit için ezan durumu listesi ana diziye ekleniyor
    }
  });

  // Tüm ezan durumlarını kontrol ederek genel durumu belirleme
  let genelEzanDurumu = "Ezan Okundu";

  ezandurum.forEach(durumListesi => {
    if (durumListesi.some(durum => durum === "Ezan Okunuyor")) {
      genelEzanDurumu = "Ezan Okunuyor";
    }
  });

  return genelEzanDurumu
}



function formatTwoDigitNumber(number) {
  return number < 10 ? '0' + number : number;
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
        let data = ezandurum()
        ws.send(JSON.stringify({ ezan: data }));
      } catch (error) {
        console.error("Veri alınamadı:", error);
      }
    }
  }, 1800);

  ws.on('close', () => {
    console.log('Bağlantı kesildi.');
    clearInterval(interval);
  });
});

server.listen(9002, () => {
  console.log('Sunucu 9001 portunda çalışıyor.');
});
