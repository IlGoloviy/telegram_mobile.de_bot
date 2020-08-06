process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const cheerio = require('cheerio');
const axios = require('axios');
const CronJob = require('cron').CronJob;

const token = 'your bot token (do not show)';
const bot = new TelegramBot(token, {polling: true});

const url = `https://suchen.mobile.de/fahrzeuge/search.html?grossPrice=false&isSearchRequest=true&maxPrice=15000&minFirstRegistrationDate=2003&scopeId=ST&sortOption.sortBy=creationTime&sortOption.sortOrder=DESCENDING`
// const url = `https://suchen.mobile.de/fahrzeuge/search.html?damageUnrepaired=NO_DAMAGE_UNREPAIRED&daysAfterCreation=1&emissionClass=EURO5&grossPrice=false&isSearchRequest=true&maxPowerAsArray=KW&maxPrice=25000&minFirstRegistrationDate=2007&minPowerAsArray=KW&scopeId=STT&sortOption.sortBy=creationTime&sortOption.sortOrder=DESCENDING`
// const url = `https://suchen.mobile.de/fahrzeuge/search.html?damageUnrepaired=NO_DAMAGE_UNREPAIRED&daysAfterCreation=1&emissionClass=EURO5&grossPrice=false&isSearchRequest=true&makeModelVariant1.makeId=25100&maxPowerAsArray=KW&maxPrice=27500&minFirstRegistrationDate=2007&minPowerAsArray=KW&scopeId=STT&sortOption.sortBy=creationTime&sortOption.sortOrder=DESCENDING`;
// const url = `https://suchen.mobile.de/fahrzeuge/search.html?damageUnrepaired=NO_DAMAGE_UNREPAIRED&daysAfterCreation=1&emissionClass=EURO5&grossPrice=false&isSearchRequest=true&makeModelVariant1.makeId=25100&                                  minFirstRegistrationDate=2007&pageNumber=1      &scopeId=STT&sortOption.sortBy=creationTime&sortOption.sortOrder=DESCENDING`;
let carsArr = [],
    carsNewArr = [],
    photo,
    name,
    price,
    countNewCars = 0;

axios.get(url)
  .then(response => { 
    const body = response.data;
    const $ = cheerio.load(body);
    const resultList = $('.cBox--resultList');
    let divResult = [];

    for (let i = 0; i < $('.cBox-body--resultitem', resultList).length; i++) {
      divResult.push($('.cBox-body--resultitem', resultList).eq(i));
      carsArr.push($('.result-item', divResult[i]));
    };
  })
  .catch(error => {
    console.log(error);
  })

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === '/start') {
    console.log(`cars on page = ${carsArr.length}`);
    bot.sendMessage(chatId, `Очікуйте! Як тільки новий товар буде доданий на сайт бот вам надішле повідомлення`);

    new CronJob('3,7,12,16,18,21,25,29,32,34,36,39,43,46,48,50,53,57,59 * * * * *', () => {
      axios.get(url)
        .then(response => { 
          const body = response.data;
          const $ = cheerio.load(body);
          const resultList = $('.cBox--resultList');
          let divResult = $('.cBox-body--resultitem', resultList).eq(0);
          let newCar = $('.result-item', divResult).attr('data-ad-id');
          
          if (carsArr[0].attr('data-ad-id') !== newCar && carsArr[1].attr('data-ad-id') !== newCar) {
            carsArr.unshift($('.result-item', divResult));
            carsArr.pop();
            carsNewArr.push($('.result-item', divResult));

            photo = $(carsNewArr[0]).children('.g-row').children('.g-col-3').children('.image-block').children('.img-responsive').attr('src');
            name = $(carsNewArr[0]).children('.g-row').children('.g-col-9').children('.g-row').children('.g-col-8').children('.headline-block').children('.h3').text();
            price = $(carsNewArr[0]).children('.g-row').children('.g-col-9').children('.g-row').children('.g-col-4').children('.price-block').children('.h3').text();  
            const noPhoto = `http://consaltliga.com.ua/wp-content/themes/consultix/images/no-image-found-360x250.png`;

            console.log('name -> ', name)
            console.log('price -> ', price)
            bot.sendPhoto(chatId, photo !== undefined ? `https:${photo.split('$')[0]}$_10.jpg` : noPhoto, {
              caption: `${name}\n\nЦіна - ${price.split('(')[0]}`,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: 'Купити',
                      url: carsNewArr[0].attr('href')
                    }
                  ]
                ]
              }
            });

            carsNewArr = [];
          }
          
          // if (countNewCars) {
          //   console.log(`number of iteration = `, countNewCars)
          //   for (let i = 0; i < countNewCars; i++) {
          //     photo = $(carsNewArr[i]).children('.g-row').children('.g-col-3').children('.image-block').children('.img-responsive').attr('src');
          //     name = $(carsNewArr[i]).children('.g-row').children('.g-col-9').children('.g-row').children('.g-col-8').children('.headline-block').children('.h3').text();
          //     price = $(carsNewArr[i]).children('.g-row').children('.g-col-9').children('.g-row').children('.g-col-4').children('.price-block').children('.h3').text();
              
          //     const noPhoto = `http://consaltliga.com.ua/wp-content/themes/consultix/images/no-image-found-360x250.png`;
          //     bot.sendPhoto(chatId, photo !== undefined ? `https:${photo.split('$')[0]}$_10.jpg` : noPhoto, {
          //       caption: `${name}\n\nЦіна - ${price.split('(')[0]}`,
          //       reply_markup: {
          //         inline_keyboard: [
          //           [
          //             {
          //               text: 'Купити',
          //               url: carsNewArr[i].attr('href')
          //             }
          //           ]
          //         ]
          //       }
          //     });
              
          //   }
          //   countNewCars = 0;
          //   carsNewArr = [];
          // }      
          
        })
        .catch(error => {
          console.log(error);
        })

    }, null, true, 'Europe/Kiev');
  }

});
