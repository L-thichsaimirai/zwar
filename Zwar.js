module.exports.config = {
    name: "Zwar",
    version: "1.0.0",
    credits: "GinzaTech",
    description: "Tham gia chiến trường zombie trên chính box chat của bạn",
    usages: "Zwar [register/shop/upgrade/info/prison/status/sell]",
    commandCategory: "game",
    cooldowns: 0,
    dependencies: ["fs-extra","axios"]
};

module.exports.onLoad = async () => {
    const fs = require("fs-extra");
    const axios = require("axios");

    const dirMaterial = __dirname + `/cache/zwar/`;

    if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
    if (!fs.existsSync(dirMaterial + "data.json")) (await axios({
            url: "https://raw.githubusercontent.com/GinzaTech/Zwar/main/data.json?token=AXCR3PNXPVK2KS72UWUYHXDBZZ6QI",
            method: 'GET',
            responseType: 'stream'
        })).data.pipe(fs.createWriteStream(dirMaterial + "data.json"));
    
    if (!fs.existsSync(dirMaterial + "fonts/bold-font.ttf")) (await axios({
            url: "https://raw.githubusercontent.com/GinzaTech/Zwar/main/items.json?token=AXCR3PMTPHYC6UKVTU6TUYDBZZ63W",
            method: 'GET',
            responseType: 'stream'
        })).data.pipe(fs.createWriteStream(dirMaterial + "items.json"));

    return;
}

module.exports.handleReaction = async ({ api, event, handleReaction, Currencies }) => {
    if (handleReaction.author != event.userID) return;
    try {
        switch (handleReaction.type) {
            case "upgradeSlotConfirm": {
                var userData = await Currencies.getData(event.userID),
                    money = userData.money,
                    zwar = userData.zwar;

                for (var i = 0; i < handleReaction.choose-1; i++) {
                    zwar.critters.push({
                        name: "Empty",
                        size: 0.0,
                        price: 0,
                    })
                }

                money = money - (handleReaction.choose * 2000);

                await Currencies.setData(event.userID, { money, zwar });
                return api.sendMessage(`[Shop Hệ Thống Vũ Khí] Bạn đã mua thành công ${handleReaction.choose} vị trí!`, event.threadID, event.messageID);
            }
            default:
                break;
        }
    }
    catch (e) {
        console.log(e);
        return api.sendMessage("[Hệ Thống Đánh Cá] Thằng Nhân Viên Nó Làm Chết Hết Cá Rồi , Hãy báo cáo với admin => '/callad'", event.threadID, event.messageID);
    }
}

module.exports.handleReply = async function({ api, event, client, handleReply, Currencies }) {
    if (handleReply.author != event.senderID) return;
    const { readFileSync } = require("fs-extra");
    const emptyItem = {
        name: "Empty",
        size: 0.0,
        price: 0,
    };

    var dataItems = readFileSync(__dirname + "/cache/zwar/items.json", "utf-8");
    dataItems = JSON.parse(dataItems);

    switch (handleReply.type) {
        case "shop": {
            switch (event.body) {
                case "1": {
                    var entryList = []
                        i = 1;
                    for (const item of dataItems.items) {
                        entryList.push(`${i}. ${item.name}: ${item.price} Đô [ ❖ ] Độ bền: ${item.duribility}, Thời Gian Chờ : ${item.time} giây`);
                        i++;
                    }
            
                    return api.sendMessage(
                        "[ ❖-❖-❖ ] [ = [ Shop Cần Câu Cá ] = ] [ ❖-❖-❖ ]" +
                        "\n[ ❖-❖ ] Hãy Lựa Chọn Theo Cách Của Bạn [ ❖-❖ ]\n\n" +
                        entryList.join("\n") +
                        "\n[ ❖ ] => Hãy Trả Lời Tin Nhắn Bot Và Chọn Theo Số Thứ Tự <= [ ❖ ]"
                    , event.threadID, (error, info) => {
                        client.handleReply.push({
                            name: this.config.name,
                            messageID: info.messageID,
                            author: event.senderID,
                            type: "buyShop"
                        });
                    }, event.messageID);
                }
                case "2": {
                    var userData = (await Currencies.getData(event.senderID)),
                        moneyAll = 0,
                        index = 0,
                        zwar = userData.zwar;

                    for (item of zwar.critters) {
                        moneyAll += item.price;
                        zwar.critters[index] = emptyItem;
                        index++;
                    }
                    const money = userData["money"] += moneyAll;
                    await Currencies.setData(event.senderID,{ money, zwar });
                    return api.sendMessage(`[ Hệ Thống Đánh Cá ] Tổng số tiền bạn bán được là: ${moneyAll} coins`, event.threadID, event.messageID);
                }
                case "3": {
                    const userData = (await Currencies.getData(event.senderID)).zwar;
                    return api.sendMessage(`[ = ] Shop Cá (Upgrade) [ = ]\n\n[!] Hiện tại bạn đang có ${userData.critters.length += 1} vị trí có thể chứa đồ trong kho đồ của bạn\n[ ❖ ] => Để Nâng Cấp Hãy Reply Tin Nhắn Và Ghi Số Slot <= [❖]`, event.threadID, (error, info) => {
                        client.handleReply.push({
                            name: this.config.name,
                            messageID: info.messageID,
                            author: event.senderID,
                            type: "upgradeSlot"
                        })
                    })
                }
                default:
                    break;
            }
            return;
        }
        //Shop
        case "buyShop": {
            try {
                const choose = parseInt(event.body);
                var userData = (await Currencies.getData(event.senderID));
                if (isNaN(event.body)) return api.sendMessage("[Shop Hệ Thống Đánh Cá] Lựa chọn của bạn không phải là một con số!", event.threadID, event.messageID);
                if (choose > dataItems.length || choose < dataItems.length) return api.sendMessage("[Shop Hệ Thống Đánh Cá] Lựa chọn của bạn vượt quá danh sách", event.threadID, event.messageID);
                const itemUserChoose = dataItems.items[choose - 1];
                if (userData.money < itemUserChoose.price) return api.sendMessage("[Shop Hệ Thống Đánh Cá] Bạn không đủ tiền để có thể mua cần câu mới", event.threadID, event.messageID);
                userData["zwar"].weapon = itemUserChoose;
                userData.money = userData.money - itemUserChoose.price;
                await Currencies.setData(event.senderID, {money: userData.money, zwar: userData.zwar});
                return api.sendMessage(`[Shop Hệ Thống Đánh Cá] Bạn đã mua thành công: ${itemUserChoose.name} với giá ${itemUserChoose.price} coins!`, event.threadID, event.messageID);
            }
            catch (e) {
                console.log(e);
                return api.sendMessage("[Hệ Thống Đánh Cá] Hiện tại không thể mở shop vì đã xảy ra lỗi hệ thống, vui lòng thử lại sau hoặc đợi thông báo!", event.threadID, event.messageID); 
            }
        }
        //upgrade
        case "upgradeSlot": {
            try {
                const choose = parseInt(event.body);
                var userData = (await Currencies.getData(event.senderID));
                if (isNaN(event.body)) return api.sendMessage("[Shop Hệ Thống Đánh Cá] Lựa chọn của bạn không phải là một con số!", event.threadID, event.messageID);
                if (choose <= 0) return api.sendMessage("[Shop Hệ Thống Đánh Cá] Lựa chọn của bạn không phải là số âm!", event.threadID, event.messageID);
                const moneyOfUpgrade = choose * 2000;
                if (userData.money < moneyOfUpgrade) return api.sendMessage(`[Shop Hệ Thống Đánh Cá] Bạn không đủ tiền để có thể mua thêm chỗ cho túi đồ, bạn còn thiếu khoảng ${moneyOfUpgrade - userData.money}`, event.threadID, event.messageID);
                return api.sendMessage(`[Shop Hệ Thống Đánh Cá] Bạn đang cần mua ${choose} vị trí với giá ${moneyOfUpgrade} coins, nếu bạn đồng ý có thể reaction tin này!`, event.threadID, (error, info) => {
                    client.handleReaction.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        choose,
                        type: "upgradeSlotConfirm"
                    })
                })
            }
            catch (e) {
                console.log(e);
                return api.sendMessage("[Hệ Thống Đánh Cá] Hiện tại không thể câu cá vì đã xảy ra lỗi hệ thống, vui lòng thử lại sau hoặc đợi thông báo!, Code : 001", event.threadID, event.messageID);
            }
        }
    
        default:
            break;
    }
}

module.exports.makeEmptyCritterList = () => {
    var zombieList = [];
    for (i = 0; i < 9; i++) {
        zombieList.push({
            name: "Empty",
            size: 0.0,
            price: 0,
        });
    }
    return zombieList;
}

module.exports.getRarity = () => this.getRarityRecursion(Math.floor(Math.random() * Math.floor(100)), -1, 0);



module.exports.getRarityRecursion = (chance, index, number) => {
    const catchChance = {
        'Siêu Bình Thường':50,
        'Bình Thường': 50,
        'Trung Bình': 50,
        'Hiếm': 50,
        'Siêu Hiếm': 50,
        'Cực Hiếm' : 50,
        'Cực Phẩm' : 50
    }
    const rarityList = [
        'Siêu Bình Thường',
        'Bình Thường',
        'Trung Bình',
        'Hiếm',
        'Siêu Hiếm',
        'Cực Hiếm',
        'Cực Phẩm'
    ]

    if (index === 0 && chance <= catchChance[rarityList[0]]) return rarityList[0]
    else if (index >= rarityList.length - 1 && chance >= catchChance[rarityList[rarityList.length - 1]]) return rarityList[rarityList.length - 1]
    else if (chance > number && chance <= (number + catchChance[rarityList[index + 1]])) return rarityList[index + 1];
    else return this.getRarityRecursion(chance, index + 1, (number + catchChance[rarityList[index + 1]]));
}

module.exports.getZombie = (zombieRarity, currentHour, currentMonth) => {
    const { readFileSync } = require("fs-extra");
    var dataZombie = readFileSync(__dirname + "/cache/zwar/data.json", "utf-8");
    dataZombie = JSON.parse(dataZombie);
    var newZombieData = dataZombie.Zombie.filter(Zombie => Zombie.time.includes(currentHour) && Zombie.months.includes(currentMonth) && Zombie.rarity.includes(zombieRarity));
    return newZombieData;
}

module.exports.addCritter = (user, critter, api, event) => {
    if (user.critters[user.critters.length - 1].price != 0 || typeof user.critters[user.critters.length - 1].price == "undefined") api.sendMessage("[Cauca] Túi của bạn không còn đủ không gian lưu trữ!", event.threadID, event.messageID);
    else {
        for (i = 0; i < user.critters.length; i++) {
            if (user.critters[i].price === 0) {
                user.critters[i] = critter;
                i = user.critters.length;
            }
        }
    }
    return user.critters;
}

module.exports.run = async function({ api, event, args, client, Currencies, Users}) {
    const emptyItem = {
        name: "None",
        price: 0,
        time: 120
    };
    var dataUser = (await Currencies.getData(event.senderID)).zwar || {};

    switch (args[0]) {
        case "register":{
            try {
                console.log(typeof dataUser);
                if (Object.entries(dataUser).length != 0) return api.sendMessage("[Hệ Thống Đánh Cá] Bạn đã từng đăng ký vào hội!", event.threadID, event.messageID);
                var zwar = {};
                zwar.weapon = emptyItem;
                zwar.critters = this.makeEmptyCritterList();
                await Currencies.setData(event.senderID, {zwar});
                return api.sendMessage("[Hệ Thống Đánh Cá] Bạn đã đăng ký vào hội thành công", event.threadID, event.messageID);
            }
            catch (e) {
                console.log(e);
                return api.sendMessage("[Hệ Thống Đánh Cá] Hiện tại không thể đăng ký vì đã xảy ra lỗi hệ thống, vui lòng thử lại sau hoặc đợi thông báo!", event.threadID, event.messageID);
            }
        }
        case "shop": {
            if (Object.entries(dataUser).length == 0)return api.sendMessage("[Hệ Thống Đánh Cá] Bạn cần đăng ký vào hội câu cá, hãy sử dụng '[ /cauca register ]'", event.threadID, event.messageID);
            return api.sendMessage(
                "[ ❖ ] [ = [ Shop Câu Cá ] = ] [ ❖ ]" +
                "\n[ ❖ ] Hãy Nhập Lựa Chọn [ ❖ ]" +
                "\n[ ❖ ] Mua Cần Câu [ 1 ] [ ❖ ]" +
                "\n[ ❖ ] Bán Cá [ 2 ] [ ❖ ]" +
                "\n[ ❖ ] Nâng Cấp Kho [ 3 ] [ ❖ ]" +
                "\n\n[ ❖ ] => Hãy Trả Lời Tin Nhắn Để Chọn !"
            , event.threadID, (error, info) => {
                client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "shop"
                });
            }, event.messageID);
        }
        case "inventory": {
            if (Object.entries(dataUser).length == 0)return api.sendMessage("[Hệ Thống Đánh Cá] Bạn cần đăng ký vào hội câu cá, hãy sử dụng '[ /cauca register ]'", event.threadID, event.messageID);
            var listCritters = [],
                msg = "",
                index = 1;
            for (const items of dataUser.critters) {
                listCritters.push({
                    name: items.name,
                    rarity: items.rarity,
                    price: items.price,
                    size: items.size
                })
            }

            listCritters.sort((a, b) => {
                if (a.size > b.size) return -1;
                if (a.size < b.size) return 1;

                if (a.price > b.price) return -1;
                if (a.price < b.price) return 1;
            })

            for (const sorted of listCritters) {
                if (index == 11 || sorted.name == "Empty") ""
                else {
                    msg += `\n${index}/ ${sorted.name} : ${sorted.size}cm - ${sorted.price} coins`;
                    index += 1;
                }
            }
            if (msg.length == 0) msg = "[!] Hiện tại inventory của bạn chưa có gì [!]";
            const filter = listCritters.filter(items => items.name !== "Empty");

            return api.sendMessage(`[※] [ Kho Đồ ] [※]\n${msg}\n\n[※] [ Thông Tin Cần Câu ] [※]\n\n৹ [ Tên Cần Câu ] : ${dataUser.weapon.name || 'Chưa có'}\n৹ [ Độ Bền Còn Lại ] : ${dataUser.weapon.duribility} lần câu\n৹ [ Tình trạng ] : ${(dataUser.weapon.duribility == 0) ? "Đã bị gãy" : "Hoạt động tốt!"}\n\n[※] [ Inventory Info ] [※]\n\n৹ Slots: ${dataUser.critters.length += 1}\n৹ Tình trạng: ${((dataUser.critters.length - filter.length) == 0) ? "Túi đã đầy" : "Túi vẫn còn chỗ trống"}`, event.threadID, event.messageID);
        }
        default: {
            try {
                const format = new Intl.NumberFormat();
                if (Object.entries(dataUser).length == 0)return api.sendMessage("[Hệ Thống Đánh Cá] Bạn cần đăng ký vào hội câu cá, hãy sử dụng '/cauca register'", event.threadID, event.messageID);
                var dates = Math.floor((Math.abs(dataUser.time - new Date()) / 1000) / 60);
                if (dataUser.weapon.price === 0) return api.sendMessage("[Hệ Thống Đánh Cá] Bạn cần mua cần câu, hãy sử dụng 'cauca shop' để mua mới!", event.threadID, event.messageID);
                else if (dates < dataUser.weapon.time) return api.sendMessage("[Hệ Thống Đánh Cá] Bạn đang trong thời gian cooldown, hãy thử lại sau!", event.threadID, event.messageID);
                else if (dataUser.weapon.duribility < 1) {
                    dataUser.weapon = emptyItem;
                    return api.sendMessage("[Hệ Thống Đánh Cá] Cần câu của bạn đã bị gãy, sử dụng '/cauca shop' để mua cần câu mới!", event.threadID, event.messageID);
                }

                var zombieRarity = this.getRarity();
                var currentHour = new Date().getHours();
                var currentMonth = new Date().getMonth();
                const zombieData = await this.getZombie(zombieRarity, currentHour, currentMonth);
                if (!zombieData) return api.sendMessage("[Hệ Thống Đánh Cá] Hiện tại trong hồ không có cá để câu", event.threadID, event.messageID);

                var today = new Date().toLocaleString("vi-vn", {timeZone: "Asia/Ho_Chi_Minh"});
                var caught = zombieData[Math.floor(Math.random() * ((zombieData.length - 1) - 0 + 1)) + 0];
                caught.size = ((Math.random() * (caught.size[0] - caught.size[1]) + caught.size[1]).toFixed(1));
                dataUser.critters = this.addCritter(dataUser, caught, api, event);
                dataUser.weapon.duribility--;
                await Currencies.setData(event.senderID, {zwar: dataUser});
                const nameUser = (await Users.getData(event.senderID)).name || (await Users.getInfo(envent.senderID)).name;
               
                return api.sendMessage(
                    "[ ❖-❖-❖ ] Bạn Đã Bắt : [" + caught.name + "] [ ❖-❖-❖ ]" +
                    "\n  [ ❖-❖ ] [ = ] [ = [ Thông Tin Chung ] = ] [ = ] [ ❖-❖ ]"+
                    "\n[ ❖ ] [ Người bắt ] : {name} [ ❖ ] " 
                    .replace(/\{name}/g, nameUser)
                +   "\n[ ❖ ] [ Kích Cỡ Zombie] : " + caught.size + " m" +
                    "\n[ ❖ ] [ Độ Hiếm Zombie] : " + caught.rarity +
                    "\n[ ❖ ] [ Mô Tả Zombie ] : " + caught.catch +
                    "\n[ ❖ ] [ Xuất Hiện Vào Tháng ] : " + caught.months + 
                    "\n[ ❖ ] [ Tổng Số Tiền Có Thể Kiếm Khi săn Được] : " + format.format(caught.price) + " Đô" +
                    "\n[ ❖ ] " + today + "[ ❖ ]"
                , event.threadID, event.messageID);
            }
            catch (e) {
                console.log(e);
                return api.sendMessage("[Hệ Thống Đánh Cá] Hiện tại không thể câu cá vì đã xảy ra lỗi hệ thống, vui lòng thử lại sau hoặc đợi thông báo!", event.threadID, event.messageID);
            }
        }
    }
}
