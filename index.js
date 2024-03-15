const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const readXlsxFile = require('read-excel-file/node');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);



const io = socketIo(server);
let data; // Burada genel veriyi saklamak için bir değişken tanımlıyoruz.
let iller = [
  "adana",
  "adıyaman",
  "afyonkarahisar",
  "ağrı",
  "aksaray",
  "amasya",
  "ankara",
  "antalya",
  "ardahan",
  "artvin",
  "aydın",
  "balıkesir",
  "bartın",
  "batman",
  "bayburt",
  "bilecik",
  "bingöl",
  "bitlis",
  "bolu",
  "burdur",
  "bursa",
  "çanakkale",
  "çankırı",
  "çorum",
  "denizli",
  "diyarbakır",
  "düzce",
  "edirne",
  "elazığ",
  "erzincan",
  "erzurum",
  "eskişehir",
  "gaziantep",
  "giresun",
  "gümüşhane",
  "hakkari",
  "hatay",
  "ığdır",
  "ısparta",
  "istanbul",
  "izmir",
  "kahramanmaraş",
  "karabük",
  "karaman",
  "kars",
  "kastamonu",
  "kayseri",
  "kilis",
  "kırıkkale",
  "kırklareli",
  "kırşehir",
  "kocaeli",
  "konya",
  "kütahya",
  "malatya",
  "manisa",
  "mardin",
  "mersin",
  "muğla",
  "muş",
  "nevşehir",
  "niğde",
  "ordu",
  "osmaniye",
  "rize",
  "sakarya",
  "samsun",
  "siirt",
  "sinop",
  "sivas",
  "şanlıurfa",
  "şırnak",
  "tekirdağ",
  "tokat",
  "trabzon",
  "tunceli",
  "uşak",
  "van",
  "yalova",
  "yozgat",
  "zonguldak"
]

function loadData(city) {
  // İl adının küçük harfe dönüştürülmesi
  

  // İl adının listede olup olmadığının kontrolü
  if (iller.includes(city)) {
    // Veriyi yüklemek için bir fonksiyon tanımlıyoruz.
 
    data = require(`./data/${city}.json`);
    
    
  } else {
    // Eşleşme yoksa bildirim döndürülür

    data= "eşleşme yok"
   
    
  }
}
console.log(data)

function ezandurum() {
let dif=-1
  const vakitler = ["İmsak", "Güneş", "Öğle", 'İkindi', 'Akşam', "Yatsı"]
  const currentDate = new Date();
  const istanbulDate = new Date(currentDate.toUTCString());
  const formattedDate = `${formatTwoDigitNumber(istanbulDate.getDate())} ${getMonthName(istanbulDate.getMonth())} ${istanbulDate.getFullYear()}`;
  istanbulDate.setHours(istanbulDate.getHours() );
  // const formattedDate = `${istanbulDate.getDate()} ${getMonthName(istanbulDate.getMonth())} ${istanbulDate.getFullYear()}`;
  const saat = istanbulDate.getHours()+3;
  const dakika = istanbulDate.getMinutes();
  let ezandurum = [];
 if(data!="eşleşme yok"){
  data?.map(res => {

    if (formattedDate === res.Tarih) {
      let ezanDurumListesi = []; // Her bir ezan zamanı için durum listesi oluşturuluyor
      vakitler.map(res1 => {
        var parts = res[res1].split(":");
        var liveHours = parseInt(parts[0], 10);
        var liveMinutes = parseInt(parts[1], 10)
        var liveTotalMinutes = liveHours * 60 + liveMinutes;
        var currentTotalMinutes = saat * 60 + dakika;
        var difference = (currentTotalMinutes-liveTotalMinutes);
       
       if(difference > -1 && difference <= 10){
        dif=difference
       }
        if (difference > -1 && difference <= 10) {
          
         // console.log(difference, "Ezan Okunuyor");
          ezanDurumListesi.push("Ezan Okunuyor"); // Ezan okunuyorsa listeye ekleniyor
        }
        else {
          if (difference > 10) {
            ezanDurumListesi.push("Ezan Okundu"); // Ezan okunmadıysa listeye ekleniyor
            //console.log(difference, "Ezan Okundu");
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

  return{ genelEzanDurumu,dif}
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
io.on('connection', (socket) => {
  console.log('Yeni bir bağlantı kuruldu.');

  socket.on('subscribe', (city) => {
    if (iller.includes(city)) {
      // İlgili il kanalına abone ol
      socket.join(city);
      // İl verisini yükle
      loadData(city);
    } else {
      console.log("İstek yapılan şehir listede bulunmuyor.");
    }
  });

  socket.on('disconnect', () => {
    console.log('Bağlantı kesildi.');
  });
});

// Her 5 saniyede bir ezan durumunu gönder
setInterval(() => {
  iller.forEach(city => {
    loadData(city);
    if (data !== "eşleşme yok") {
      let ezanData = ezandurum();
      io.to(city).emit('ezan',{ezanData,city});
    }
  });
}, 5000);

server.listen(9002, () => {
  console.log('Sunucu 9002 portunda çalışıyor.');
});