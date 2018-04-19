'use strict';

let TelegramToken = "583270771:AAHdswdtpu3-_b5gi94vMbkEh-7YxNC6qd4";

const bot_telegram_id = 583270771;
const my_telegram_chat_id = 267688141;

const TeleBot = require('telebot');
const bot = new TeleBot(TelegramToken);


//[inline mention of a user](tg://user?id=267688141)

bot.on('text', function(msg) {

});

bot.on(['/menu', '/help'], (msg) => {
    let replyMarkup = bot.inlineKeyboard([
        [
            bot.inlineButton('🎲 Случайный пользователь', {callback: 'random'}),
        ], [
            bot.inlineButton('🎰 BlackJack', {callback: 'black_jack'})
        ], [
            bot.inlineButton('🗺 Map', {callback: 'map'})
        ]
    ]);
  bot.sendMessage(msg.chat.id, "Список доступных комманд: ",{parseMode:'markdown',replyMarkup});

});

bot.on(['/hide'], (msg) => {
  bot.sendMessage(msg.chat.id, 'Клавиатура спрятана. Напишите /start чтобы показать.', {parseMode:'markdown',replyMarkup:'hide'});
});

bot.on(['/start'], (msg) => {
  let replyMarkup = bot.keyboard([
        ['/menu','/map'],
        ['/hide']
  ], {resize: true});
  bot.sendMessage(msg.chat.id,'Привет, *'+msg.from.first_name+'*! напиши /menu чтобы открыть список комманд.',{parseMode:'markdown',replyMarkup});
});

bot.on(['/random'], (msg) => {
  /*
  bot.getChat(msg.chat.id).then((response) => {
      let chat = response;

  }).catch((error) => {
      console.log('Error:', error);
  });
  */

});

bot.on(['/map'], (msg) => {
  bot.sendLocation(msg.chat.id, [Math.random() * (90+90)-90, Math.random() * (180+180)-180]);
});




let apps = new Map();

class Random{
  constructor(chat_id,guid){
    this.guid = guid;
    this.chat_id = chat_id;
    this.ids = [];
    this.edit_msg_id = 'no';
    this.reply_markup_active =  bot.inlineKeyboard([
        [
            bot.inlineButton('➕Присоеденится', {callback: 'random_join'}),
        ], [
            bot.inlineButton('✖️Закончить', {callback: 'random_end'})
        ]
    ]);
    this.reply_markup_end = bot.inlineKeyboard([
        [
            bot.inlineButton('Начать новый', {callback: 'random'}),
        ]
    ]);
  }
  joined(players,players_names,ids,id,name){
    this.ids = ids;
    this.players = players;
    this.players_names = players_names;
    let replyMarkup = this.reply_markup_active;
    //console.log(replyMarkup.inline_keyboard[0]);
    let chat_id = this.chat_id,
        edit_msg_id = this.edit_msg_id;

    bot.editMessageText({chatId: chat_id, messageId: edit_msg_id},'Выбор случайного пользователя активирован.\n\n*Участники:* _'+players_names+'_\n\n`UID: '+this.guid+'`',{parseMode:'markdown',replyMarkup}).catch(error => console.log('Error5:', error));
  }
  choose(){
    if (this.ids.length > 0){
      let win_id = this.ids[Math.floor(Math.random() * this.ids.length)];
      let replyMarkup = bot.inlineKeyboard([
          [
              bot.inlineButton('Начать новый', {callback: 'random'}),
          ]
      ]);
      let chat_id = this.chat_id,
          edit_msg_id = this.edit_msg_id;

      bot.editMessageText({chatId: chat_id, messageId: edit_msg_id},
        'Выбор случайного пользователя завершен.\n\n*Участники:*_'+this.players_names+'_\n\n*Победил:* ['+this.players.get(win_id)+'](tg://user?id='+win_id+') 🔶\n\n`UID: '+this.guid+'`',
        {parseMode:'markdown',replyMarkup})
        .catch(error => console.log('Error3:', error)
      );
    } else {
      let replyMarkup = this.reply_markup_end;
      let chat_id = this.chat_id,
          edit_msg_id = this.edit_msg_id;
      if (this.edit_msg_id != 'no'){
        bot.editMessageText({chatId: chat_id, messageId: edit_msg_id},'Выбор случайного пользователя завершен.\n\n*Победителя нету.*\n\n`UID: '+this.guid+'`',{parseMode:'markdown',replyMarkup}).catch(error => console.log('Error1:', error));
      }
    }
    return true;
  }
  start(){
    let replyMarkup = this.reply_markup_active;
    let chat_id = this.chat_id;
    bot.sendMessage(chat_id, 'Выбор случайного пользователя активирован.\n\n`UID: '+this.guid+'`', {parseMode:'markdown',replyMarkup}).then(re => {
        apps.get(chat_id).app.edit_msg_id = re.message_id;
    });
  }
  end(){
    this.choose();
  }
}

class BlackJack{
  constructor(sender_id, sender_name, chat_id, guid){
    this.sender_id = sender_id;
    this.sender_name = sender_name;
    this.chat_id = chat_id;
    this.guid = guid;
    this.used_cards = '';
    this.score = 0;
    this.reply_markup_lobby = bot.inlineKeyboard([
        [
            bot.inlineButton('Присоеденится', {callback: 'black_jack_join'}),

        ],
        [
          bot.inlineButton('Начать игру', {callback: 'black_jack_start'}),
        ]
    ]);
    this.reply_markup_active = bot.inlineKeyboard([
        [
            bot.inlineButton('Еще', {callback: 'black_jack_more'}),

        ],
        [
          bot.inlineButton('Стоп', {callback: 'black_jack_stop'}),
        ]
    ]);
    this.reply_markup_end = bot.inlineKeyboard([
        [
            bot.inlineButton('Сыграть еще', {callback: 'black_jack_again'}),
        ],
        [
            bot.inlineButton('Начать новую', {callback: 'black_jack'}),
        ]
    ]);
    this.reply_markup_end_all = bot.inlineKeyboard([
        [
            bot.inlineButton('Начать новую', {callback: 'black_jack'}),
        ]
    ]);

    this.state = 'null';
    this.ids = [];

    this.game_players = new Map();
  }
  joined(players,players_names,ids,id,name){
    this.ids = ids;
    this.players = players;
    this.players_names = players_names;

    //status: 0 - didn't make a step, 1 - made a step
    let obj = {
      name: name,
      id: id,
      score: 0,
      status: 0,
      cards: ''
    }
    this.game_players.set(id,obj);

    let replyMarkup = this.reply_markup_lobby;
    let chat_id = this.chat_id,
        edit_msg_id = this.edit_msg_id;
    bot.editMessageText({chatId: chat_id, messageId: edit_msg_id},'🎰*BlackJack* - _Лобби_\n[Добавь бота в лс](tg://user?id=583270771)\n\nИгорки: _'+this.players_names+'_ \n\n`UID: '+this.guid+'`',{parseMode:'markdown',replyMarkup}).catch(error => console.log('Error7:', error));
  }
  start(){
    this.state = 'lobby';
    let replyMarkup = this.reply_markup_lobby;
    let chat_id = this.chat_id;

    bot.sendMessage(chat_id, '🎰*BlackJack* - _Лобби_\n[Добавь бота в лс](tg://user?id=583270771)\n\nНажмите *Присоеденится* чтобы войти\n\n`UID: '+this.guid+'`', {parseMode:'markdown',replyMarkup}).then(re => {
        apps.get(chat_id).app.edit_msg_id = re.message_id;
    });
  }
  start_game(){
    // > 1 MUST BE
    if (this.ids.length > 0){
      this.state = 'game';
      for (const entry of this.game_players.entries()) {
        this.more(entry[1].id,0);
        this.more(entry[1].id,1);
      }
      this.update();
    } else {

    }
  }
  step(){

  }
  update(){

    this.state = 'game';
    let replyMarkup = this.reply_markup_active;
    let chat_id = this.chat_id,
        edit_msg_id = this.edit_msg_id;

    let names = '';
    let ready = true;
    for (const entry of this.game_players.entries()) {
      names += '\n';
      if (entry[1].status == 0){
        names += '❎ ';
      } else if (entry[1].status == 1){
        names += '✅ ';
      }
      names += entry[1].name;
      if (entry[1].status == 0){
        ready = false;
      }
    }
    if (ready){
      this.end_game();
    }
    if (names != this.names){
      bot.editMessageText({chatId: chat_id, messageId: edit_msg_id},'🎰*BlackJack* - _Игра_\n[Добавь бота в лс](tg://user?id=583270771)\n\nДелайте свой выбор!\n\n*Игроки:* _'+names+'_ \n\n`UID: '+this.guid+'`',{parseMode:'markdown',replyMarkup}).catch(error => console.log('Error2:', error));
    }
    this.names = names;
  }
  stop(player_id){
    if (this.state == 'game'){
      if (this.game_players.has(player_id)){

        if (this.game_players.get(player_id).status != 1){
          let chat_id = this.chat_id,
              name = this.game_players.get(player_id).name;
          bot.sendMessage(player_id, '*Вы остановились на '+this.game_players.get(player_id).score + '* '+this.game_players.get(player_id).cards+'. `\nGUID: '+this.guid+'`',{parseMode:'markdown'}).catch(re => {
              bot.sendMessage(chat_id, '❗️Разблокируйте бота, *'+name+'.*[Добавь бота в лс](tg://user?id=583270771)`\nGUID: '+this.guid+'`',{parseMode:'markdown'});
          });
          this.game_players.get(player_id).status = 1;
          this.update();
        }
      }
    }
  }
  more(player_id,send){
    if (this.state == 'game'){
    if (this.game_players.has(player_id)){
      if (this.game_players.get(player_id).score <= 21 && this.game_players.get(player_id).status == 0){
        let possible = "ТВДК6789М";

        let rand_;
        do {
          rand_ = possible.charAt(Math.floor(Math.random() * possible.length));
        } while ( count(this.used_cards, rand_) > 3 )

        let rand = rand_;
        this.used_cards += rand;

        let k = 0;
        if (rand == 'Т'){
          k = 11;
        } else if (rand == 'В'){
          k = 2;
        } else if (rand == 'Д'){
          k = 3;
        } else if (rand == 'К'){
          k = 4;
        } else if (rand == 'М'){
          k = 10;
        } else {
          k = parseInt(rand);
        }

        this.game_players.get(player_id).cards += rand;
        this.game_players.get(player_id).score += k;
        let chat_id = this.chat_id,
            name = this.game_players.get(player_id).name;
        if (this.game_players.get(player_id).score <= 21 && send == 1){
          bot.sendMessage(player_id, '*'+this.game_players.get(player_id).score + '* '+this.game_players.get(player_id).cards+' - ваш счет. `\nGUID: '+this.guid+'`',{parseMode:'markdown'}).catch(re => {
              bot.sendMessage(chat_id, '❗️Разблокируйте бота, *'+name+'.*[Добавь бота в лс](tg://user?id=583270771)`\nGUID: '+this.guid+'`',{parseMode:'markdown'});
          });
        } else {
          if (this.game_players.get(player_id).status != 1 && send == 1){
            bot.sendMessage(player_id, '*'+this.game_players.get(player_id).score + '* '+this.game_players.get(player_id).cards+' (*перебор*) - ваш счет `\nGUID: '+this.guid+'`',{parseMode:'markdown'}).catch(re => {
                bot.sendMessage(chat_id, '❗️Разблокируйте бота, *'+name+'.*[Добавь бота в лс](tg://user?id=583270771)`\nGUID: '+this.guid+'`',{parseMode:'markdown'});
            });
            this.game_players.get(player_id).status = 1;
          }
        }
        this.update();
      } else {
        let chat_id = this.chat_id,
            name = this.game_players.get(player_id).name;
        if (this.game_players.get(player_id).status != 1 && send == 1){
          bot.sendMessage(player_id, '*'+this.game_players.get(player_id).score + '* '+this.game_players.get(player_id).cards+' (*перебор*) - ваш счет `\nGUID: '+this.guid+'`',{parseMode:'markdown'}).catch(re => {
              bot.sendMessage(chat_id, '❗️Разблокируйте бота, *'+name+'.*[Добавь бота в лс](tg://user?id=583270771)`\nGUID: '+this.guid+'`',{parseMode:'markdown'});
          });
          this.game_players.get(player_id).status = 1;
          this.update();
        }

      }

    }
  }
  }
  again(){
    for (const entry of this.game_players.entries()) {
      entry[1].score = 0;
      entry[1].status = 0;
      entry[1].cards = '';
    }
    this.start_game();
  }
  end_game(){
    this.state = 'end';
    let replyMarkup = this.reply_markup_end;
    let chat_id = this.chat_id,
        edit_msg_id = this.edit_msg_id;

    let names = '';
    let closest = 100;
    for (const entry of this.game_players.entries()) {
      if (entry[1].score <= 21){
        if (21 - entry[1].score < closest){
          closest = 21 - entry[1].score;
        }
      }
    }
    for (const entry of this.game_players.entries()) {
      names += '\n';
      if (21 - entry[1].score == closest){
        names += '🔶';
      }
      names += '['+entry[1].name+'](tg://user?id='+entry[1].id+')';
      names += ' - *'+entry[1].score+'*' + ' _'+entry[1].cards+'_';
    }

    setTimeout(function(){
        bot.editMessageText({chatId: chat_id, messageId: edit_msg_id},'🎰*BlackJack* - _Игра_\n\nИгра закончена!\n\n*Игроки:* '+names+' \n\n`UID: '+this.guid+'`',{parseMode:'markdown',replyMarkup}).catch(error => console.log('Error2:', error));
    }.bind(this),200);


  }
  end(){
      this.state = 'end';
      let replyMarkup = this.reply_markup_end_all;
      let chat_id = this.chat_id,
          edit_msg_id = this.edit_msg_id;
      bot.editMessageText({chatId: chat_id, messageId: edit_msg_id},'🎰*BlackJack* - _Игра закончена_\n\n`UID: '+this.guid+'`',{parseMode:'markdown',replyMarkup}).catch(error => console.log('Error1:', error));
  }
}

class App{
  constructor(sender_name, _id,chat_id,type){
    this.guid = guid();
    this.sender
    this.chat_id = chat_id;
    this.sender_name = sender_name;

    this.type = type;
    this.players = new Map();
    this.ids = [];
    this.players_names = "";

    if (this.type == 'random'){
      this.app = new Random(this.chat_id, this.guid);
    } else if (this.type == 'black_jack'){
      this.app = new BlackJack(this.sender_name,this.sender_id,this.chat_id, this.guid);
    }
    this.app.start();
  }
  join(id,name){
    if ( !this.players.has(id) ){
      this.ids.push(id);
      this.players.set(id,name);
      this.players_names += '\n'+name;
      if (this.type == 'random'){
        this.app.joined(this.players,this.players_names,this.ids,id,name);
      } else if (this.type == 'black_jack'){
        if ( this.app.state == 'lobby' ){
          this.app.joined(this.players,this.players_names,this.ids,id,name);
        }
      }
      return true;
    } else {
      return false;
    }
  }
}

bot.on('callbackQuery', msg => {
    // User message alert
    if (msg.data == 'random') {
        if (apps.has(msg.message.chat.id)){
          apps.get(msg.message.chat.id).app.end();
        }
        apps.set(msg.message.chat.id, new App(msg.from.first_name,msg.from.id,msg.message.chat.id,'random'));
    } else if (msg.data == 'black_jack'){
        if (apps.has(msg.message.chat.id)){
          apps.get(msg.message.chat.id).app.end();
        }
        apps.set(msg.message.chat.id, new App(msg.from.first_name,msg.from.id,msg.message.chat.id,'black_jack'));
    } else if (msg.data == 'map'){
      bot.sendLocation(msg.message.chat.id, [Math.random() * (90+90)-90, Math.random() * (180+180)-180]);
    }

    if (msg.data == 'random_join'){
      if (apps.has(msg.message.chat.id) && apps.get(msg.message.chat.id).type == 'random'){
          apps.get(msg.message.chat.id).join(msg.from.id,msg.from.first_name);
      } else {
        let replyMarkup = bot.inlineKeyboard([
            [
                bot.inlineButton('Начать новый', {callback: 'random'}),
            ]
        ]);
        bot.sendMessage(msg.message.chat.id,'Выбор неактивен, *'+msg.from.first_name+'*', {parseMode:'markdown',replyMarkup});
      }
    }
    else if (msg.data == 'random_end'){
      if (apps.has(msg.message.chat.id)  && apps.get(msg.message.chat.id).type == 'random'){
        if ( apps.get(msg.message.chat.id).app.choose() ) {
          apps.delete(msg.message.chat.id);
        }
      } else {
        let replyMarkup = bot.inlineKeyboard([
            [
                bot.inlineButton('Начать новый', {callback: 'random'}),
            ]
        ]);
        bot.sendMessage(msg.message.chat.id,'Выбор неактивен, *'+msg.from.first_name+'*', {parseMode:'markdown',replyMarkup});
      }
    }
    else if (msg.data.includes('black_jack') ){
      if (apps.has(msg.message.chat.id) && apps.get(msg.message.chat.id).type == 'black_jack'){
        if (msg.data == 'black_jack_stop'){
          apps.get(msg.message.chat.id).app.stop(msg.from.id);
        }
        else if (msg.data == 'black_jack_more'){
          apps.get(msg.message.chat.id).app.more(msg.from.id,1);
        }
        else if (msg.data == 'black_jack_again'){
          apps.get(msg.message.chat.id).app.again();
        }
        else if (msg.data == 'black_jack_join'){
          apps.get(msg.message.chat.id).join(msg.from.id,msg.from.first_name);
        }
        else if (msg.data == 'black_jack_start'){
          apps.get(msg.message.chat.id).app.start_game();
        }
      } else {
        let replyMarkup = bot.inlineKeyboard([
            [
                bot.inlineButton('Начать новую', {callback: 'black_jack'}),
            ]
        ]);
        bot.sendMessage(msg.message.chat.id,'Игра неактивна, *'+msg.from.first_name+'*', {parseMode:'markdown',replyMarkup});
      }
    }


});

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(10)
      .substring(1);
  }
  return s4();
}

function count(array,s_){
  var count = 0;
  for(var i = 0; i < array.length; ++i){
      if(array[i] == s_)
          count++;
  }
  return count;
}

bot.start();
