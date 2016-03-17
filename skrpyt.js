javascript:
var infoVillageUrl = window.location.href.split("&")[0] + "&screen=info_village&id=";

var allyNames = {
	friendAlly: [],
	enemyAlly:[]
}
allyNames.friendAlly = ["Plemie A", "Plemie B"];
allyNames.enemyAlly =["Plemie C"];

var minDistance = 10;

var forumTable = "";
var friendPlayersWithVillages = [];
var enemyVillages = [];

function getAllyNameFromJsonString(data){
	var allyName = data.match(/"ally_name"[ :]+((?=\[)\[[^]]*\]|(?=\{)\{[^\}]*\}|\"[^"]*\")/);
	return allyName!=null?allyName[1].replace(/"/g, ''):0;
}
function getPlayerNameFromJsonString(data){
	var playerName = data.match(/"player_name"[ :]+((?=\[)\[[^]]*\]|(?=\{)\{[^\}]*\}|\"[^"]*\")/);
	return playerName!=null?playerName[1].replace(/"/g, ''):0;
}
function createUrl(id){
	return infoVillageUrl+id+"&"
}
function addEnemyVillageToList(coord){
	enemyVillages.push({x:coord.x, y:coord.y})
}
function getPlayerIndex(playerName){
	for (index = 0; index < friendPlayersWithVillages.length; ++index){
		if(playerName === friendPlayersWithVillages[index].playerName){
			return index;
		}
	}
	return -1;
}
function getEmptyVillageObject(){
	return {coord, distance: 0, enemyCoord: {}, closeEnemies: 0}
}
function addFriendVillageToList(playerName, coord){
	playerIndex = getPlayerIndex(playerName);
	if(-1 === playerIndex){
		friendPlayersWithVillages.push({
			playerName:playerName,
		villages: [getEmptyVillageObject()]}) 
	}else{
		friendPlayersWithVillages[playerIndex].villages.push(getEmptyVillageObject());
	}
}
function addVillageToLists(page,coord){
	playerName = getPlayerNameFromJsonString(page);
	if(!playerName){
		return;
	}
	
	allyName = getAllyNameFromJsonString(page);
	if(!allyName){
		return;
	}
    if(-1 < $.inArray(allyName,allyNames.friendAlly)){
		 addFriendVillageToList(playerName, coord); 
		 
	}else if(-1 < $.inArray(allyName,allyNames.enemyAlly)){
		addEnemyVillageToList(coord);
	}
}
function getVillagePageAndAddToLists(url,coord) {
  $.ajax({
    url: url,  
    success: function(page) {	
      addVillageToLists(page,coord)
    },
	async: false
  });
}
function getDistance(coord1, coord2){
	return Math.sqrt(Math.pow(coord1.x - coord2.x,2) + Math.pow(coord1.y - coord2.y,2))
}
function fillDistance(village, villageIndex,playerIndex){
	var tmpDistance = minDistance+1;
	var tmpEnemyCoord = {};
	for (index = 0; index < enemyVillages.length; index++){
		distance = getDistance(village.coord, enemyVillages[index])
		if(distance <= tmpDistance){
			tmpDistance = distance;
			tmpEnemyCoord = enemyVillages[index];
			village.closeEnemies++;
		}
	}
	village.distance = tmpDistance;
	village.enemyCoord = tmpEnemyCoord;
	if (tmpDistance > minDistance){
		friendPlayersWithVillages[playerIndex].villages.splice(villageIndex,1)
	}
	if(!friendPlayersWithVillages[playerIndex].villages.length){
			friendPlayersWithVillages.splice(playerIndex,1)
	}	
}
function fillDistanceEachVillageInPlayer(player, playerIndex){
	for (villageIndex = player.villages.length - 1; villageIndex >= 0 ; villageIndex--){
		fillDistance(player.villages[villageIndex],villageIndex,playerIndex);
	}
}
function fillDistanceEachPlayers(){
	for (playerIndex = friendPlayersWithVillages.length - 1; playerIndex >= 0 ; playerIndex--){
		fillDistanceEachVillageInPlayer(friendPlayersWithVillages[playerIndex],playerIndex);
	}
}

function round(n, k)
{
    var factor = Math.pow(10, k+1);
    n = Math.round(Math.round(n*factor)/10);
    return n/(factor/10);
}
function createPlayerBBCode(playerName){
	return "[player]"+playerName+"[/player]";
}
function createCoordBBCode(coord){
	return "[coord]"+coord.x+"|"+coord.y+"[/coord]";
}
function addVillageToForumTable(playerName,village){
	forumTable = forumTable + "[*]"+createPlayerBBCode(playerName)+"[|]"+createCoordBBCode(village.coord)+"[|]"+village.closeEnemies+"[|]"+Round(village.distance, 2)+"[|]"+createCoordBBCode(village.enemyCoord)+"[|]\n";
}
function addHeaderOfTable(){
	forumTable = forumTable + "[**]Gracz[||]Wioska[||]Licz. blis. wrogów[||]Odległ->[||]Najbliższa wioska wroga[||]Ilość stacjonujących paczek[/**]\r\n"
}
function addTableMarker(){
	forumTable = "[table]" + forumTable + "[/table]\n";
}
function createTableInBBCode(){
	addHeaderOfTable();
	for (playerIndex = friendPlayersWithVillages.length - 1; playerIndex >= 0 ; playerIndex--){
		for (villageIndex = friendPlayersWithVillages[playerIndex].villages.length - 1; villageIndex >= 0 ; villageIndex--){
			addVillageToForumTable(friendPlayersWithVillages[playerIndex].playerName,friendPlayersWithVillages[playerIndex].villages[villageIndex])
		}
	}
	addTableMarker();
}
function startSctipt(){
	try{
		Object.keys(TWMap.villages).forEach(function(data) {
			village =  TWMap.villages[data];
			coord = {
				x: parseInt(village.xy.toString().substr(0, 3)),
				y: parseInt(village.xy.toString().substr(3))
			}
			page = getVillagePageAndAddToLists(createUrl(village.id),coord);
		});
		}
	catch(err){}
	
	fillDistanceEachPlayers();
	console.log(friendPlayersWithVillages);
	createTableInBBCode();
	Dialog.show("okienko",forumTable);
}
startSctipt();