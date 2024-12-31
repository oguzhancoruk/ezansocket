const readXlsxFile = require('read-excel-file/node');

async function getSpecificRow(ezanDate) {

  const path = '/Users/oguzhancoruk/Desktop/vemlo tv/assets/ezan_sehir/İstanbul.xlsx';

  try {

    const rows = await readXlsxFile(path);


    const specificRows = rows.filter(row => row[0].includes(ezanDate));


    const remainingRows = specificRows.map(row => row.slice(2));


    const allDayDictionaries = [];


    for (const row of remainingRows) {
      const dayDictionary = {
        "İmsak": row[0],
        "Güneş": row[1],
        "Öğle": row[2],
        "İkindi": row[3],
        "Akşam": row[4],
        "Yatsı": row[5]
      };
      allDayDictionaries.push(dayDictionary);
    }

    console.log(allDayDictionaries);
  } catch (error) {
    console.error(error);
  }
}

getSpecificRow("30 Aralık 2025");