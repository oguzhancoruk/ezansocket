const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const readXlsxFile = require('read-excel-file/node');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


let iller = [
  "adana", "adıyaman", "afyonkarahisar", "ağrı", "aksaray", "amasya", "ankara", "antalya", "ardahan", "artvin", "aydın", "balıkesir", "bartın",
  "batman", "bayburt", "bilecik", "bingöl", "bitlis", "bolu", "burdur", "bursa", "çanakkale", "çankırı", "çorum", "denizli", "diyarbakır",
  "düzce", "edirne", "elazığ", "erzincan", "erzurum", "eskişehir", "gaziantep", "giresun", "gümüşhane", "hakkari", "hatay", "ığdır", "ısparta",
  "istanbul", "izmir", "kahramanmaraş", "karabük", "karaman", "kars", "kastamonu", "kayseri", "kilis", "kırıkkale", "kırklareli", "kırşehir",
  "kocaeli", "konya", "kütahya", "malatya", "manisa", "mardin", "mersin", "muğla", "muş", "nevşehir", "niğde", "ordu", "osmaniye", "rize",
  "sakarya", "samsun", "siirt", "sinop", "sivas", "şanlıurfa", "şırnak", "tekirdağ", "tokat", "trabzon", "tunceli", "uşak", "van", "yalova", "yozgat",
  "zonguldak"
];

async function loadData(city) {

  // İl adının küçük harfe dönüştürülmesi



  // İl adının listede olup olmadığının kontrolü
  if (iller.includes(city)) {
    // Veriyi yüklemek için bir fonksiyon tanımlıyoruz.

    let city_json = require(`./data/${city}.json`);
   
    return city_json
  } else {
    // Eşleşme yoksa bildirim döndürülür
    return "eşleşme yok";
  }
}

async function ezandurum(data) {

  let dif = -1;
  const vakitler = ["İmsak", "Güneş", "Öğle", 'İkindi', 'Akşam', "Yatsı"];
  const currentDate = new Date();
  const istanbulDate = new Date(currentDate.toUTCString());
  const formattedDate = `${formatTwoDigitNumber(istanbulDate.getDate())} ${getMonthName(istanbulDate.getMonth())} ${istanbulDate.getFullYear()}`;
  istanbulDate.setHours(istanbulDate.getHours());
  const saat = istanbulDate.getHours() + 3;
  const dakika = istanbulDate.getMinutes();
  let ezandurum = [];


  if (data != undefined && data != "eşleşme yok") {


    data?.map(res => {


      if (formattedDate === res?.Tarih) {
        let ezanDurumListesi = []; // Her bir ezan zamanı için durum listesi oluşturuluyor
        vakitler.map(res1 => {
          var parts = res[res1].split(":");
          var liveHours = parseInt(parts[0], 10);
          var liveMinutes = parseInt(parts[1], 10)
          var liveTotalMinutes = liveHours * 60 + liveMinutes;
          var currentTotalMinutes = saat * 60 + dakika;
          var difference = (currentTotalMinutes - liveTotalMinutes);

          if (difference > -1 && difference <= 10) {
            dif = difference;
          }
          if (difference > -1 && difference <= 10) {
            ezanDurumListesi.push("Ezan Okunuyor"); // Ezan okunuyorsa listeye ekleniyor
          } else {
            if (difference > 10) {
              ezanDurumListesi.push("Ezan Okundu"); // Ezan okunmadıysa listeye ekleniyor
            }
          }
        });
        ezandurum.push(ezanDurumListesi); // Her bir vakit için ezan durumu listesi ana diziye ekleniyor
      }
    });
  }

  // Tüm ezan durumlarını kontrol ederek genel durumu belirleme
  let genelEzanDurumu = "Ezan Okundu";

  ezandurum.forEach(durumListesi => {
    if (durumListesi.some(durum => durum === "Ezan Okunuyor")) {
      genelEzanDurumu = "Ezan Okunuyor";
    }
  });

  return { genelEzanDurumu, dif};
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

const channels = {};

wss.on('connection', (ws) => {
  console.log('Yeni bir bağlantı kuruldu.');

  ws.on('message', async (message) => {
    var str = new TextDecoder().decode(message);

    // Eğer gelen mesajın 'city' alanı varsa, bu şehrin verisini yüklüyoruz.
    if (iller.includes(str)) {
      const city = str;
      if (!channels[city]) {
        channels[city] = { sockets: [], interval: null };
        await loadData(str);
      }
      channels[city].sockets.push(ws);
      if (!channels[city].interval) {
        openChannel(city);
      }
    } else {
      // Eğer şehir listede yoksa, sokete mesaj gönderme ve interval çalışmasını durdurma.
      console.log("İstek yapılan şehir listede bulunmuyor.");
    }
  });

  ws.on('close', () => {
    console.log('Bağlantı kesildi.');
    // Eğer bağlantı kesilirse, tüm kanallardan bu soketi kaldırın
    for (const channel in channels) {
      const index = channels[channel].sockets.indexOf(ws);
      if (index !== -1) {
        channels[channel].sockets.splice(index, 1);
        // Eğer bu kanalda artık soket yoksa ve interval varsa, interval'ı durdurun
        if (channels[channel].sockets.length === 0 && channels[channel].interval) {
          clearInterval(channels[channel].interval);
          channels[channel].interval = null;
        }
      }
    }
  });
});

async function openChannel(city) {


  if (channels[city]) {

    channels[city].interval = setInterval(async () => {


      try {
        loadData(city).then(async res => {


          let ezanData = await ezandurum(res);
          channels[city].sockets.forEach(socket => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ ezan: ezanData, city }));
            }
          });

        })


      } catch (error) {
        console.error("Veri alınamadı:", error);
      }
    }, 5000);
  }
}

server.listen(9002, () => {
  console.log('Sunucu 9001 portunda çalışıyor.');
});


