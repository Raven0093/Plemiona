javascript:
var infoVillageUrl = window.location.href.split("&")[0] + "&screen=info_village&id=";
var allyNames = {}
allyNames.friendAlly = ["Angry Carrots"];
allyNames.enemyAlly =["Friends"];
var minDistance = 10;
var ingoredVillages = "";
var forumTable = "";
var friendPlayersWithVillages = [];
var enemyVillages = [];
var listOfVillages = [];
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
function getEmptyVillageObject(coord){
	return {coord:{x:coord.x, y:coord.y}, distance: minDistance+1, enemyCoord: {}, closeEnemies: 0}
}
function addFriendVillageToList(playerName, coord){
	playerIndex = getPlayerIndex(playerName);
	if(-1 === playerIndex){
		friendPlayersWithVillages.push({
			playerName:playerName,
		villages: [getEmptyVillageObject(coord)]}) 
	}else{
		friendPlayersWithVillages[playerIndex].villages.push(getEmptyVillageObject(coord));
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
		error: function(){
			getVillagePageAndAddToLists(url,coord)
		},
		async: true,
		timeout: 30000
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
	forumTable = forumTable + "[*]"+createPlayerBBCode(playerName)+"[|]"+createCoordBBCode(village.coord)+"[|]"+village.closeEnemies+"[|]"+round(village.distance, 2)+"[|]"+createCoordBBCode(village.enemyCoord)+"[|]\n";
}
function addHeaderOfTable(){
	forumTable = forumTable + "[**]Gracz[||]Wioska[||]Licz. blis. wrogów[||]Odległ->[||]Najbliższa wioska wroga[||]Ilość stacjonujących paczek[/**]\r\n"
}
function addTableMarker(){
	forumTable = "[table]" + forumTable + "[/table]\n";
}
function createTableAndList(){
	addHeaderOfTable();
	for (playerIndex = friendPlayersWithVillages.length - 1; playerIndex >= 0 ; playerIndex--){
		for (villageIndex = friendPlayersWithVillages[playerIndex].villages.length - 1; villageIndex >= 0 ; villageIndex--){
			addVillageToForumTable(friendPlayersWithVillages[playerIndex].playerName,friendPlayersWithVillages[playerIndex].villages[villageIndex])
			listOfVillages.push(friendPlayersWithVillages[playerIndex].villages[villageIndex].coord.x + "|" + friendPlayersWithVillages[playerIndex].villages[villageIndex].coord.y + ";")
		}
	}
	addTableMarker();
}
function displayAlliesInDialog(allyArray,htmlElementName,removeFunctionName){
	var allies = "";
	for (var i = 0; i < allyArray.length; i++) {
		allies += allyArray[i] + "<a href='#' onClick='javascript:"+removeFunctionName+"(" + i + ");'>-usuń</a> <br>";
	};
	document.getElementById(htmlElementName).innerHTML = allies;
}
function addFriendAlly () {
	var addAlly = document.getElementById('addFriendAlly').value;
	allyNames.friendAlly.push(addAlly);
	displayAlliesInDialog(allyNames.friendAlly,'FriendsAllies',removeFriendAlly.name)
}
function removeFriendAlly (i) {
	allyNames.friendAlly.splice(i, 1);
	displayAlliesInDialog(allyNames.friendAlly,'FriendsAllies',removeFriendAlly.name)
}
function addEnemyAlly () {
	var addAlly = document.getElementById('addEnemyAlly').value;
	allyNames.enemyAlly.push(addAlly);
	displayAlliesInDialog(allyNames.enemyAlly,'EnemyAllies',removeEnemyAlly.name)
}
function removeEnemyAlly (i) {
	allyNames.enemyAlly.splice(i, 1);
		displayAlliesInDialog(allyNames.enemyAlly,'EnemyAllies',removeEnemyAlly.name)
}
function showPrompt(){
	if (!document.contains(document.getElementById("AllyPrompt"))){
		var newDiv = document.createElement("div"); 
		newDiv.id = "AllyPrompt"
		list = document.getElementById("content_value");
		list.insertBefore(newDiv, list.childNodes[0])
		document.getElementById("AllyPrompt").innerHTML = '\
		Plemiona sojusznicze: <br> \
		<input type="text" placeholder="nazwa plemienia" value="" id="addFriendAlly" /> \
		<input type="submit" value="Dodaj plemie do listy" onClick="addFriendAlly();"> \
		<div id="FriendsAllies"></div> <br> \
		Plemiona wrogie:<br> \
		<input type="text" placeholder="nazwa plemienia" value="" id="addEnemyAlly" /> \
		<input type="submit" value="Dodaj plemie do listy" onClick="addEnemyAlly();"> \
		<div id="EnemyAllies"></div> <br> \
		Maksymalna odległość między wioskami:<br> \
		<input type="number" id="minDistance" value='+minDistance+' min="1" max="100"><br> \
		Wioski wroga do pominięcia: (rozdzielone ";" np. 123|321;323|234) <br> \
		<textarea placeholder="Wpisz wioski do pominięcia" id="ingoredVillages"  data-autosize-input="{ "space": 20 }">'+ingoredVillages+'</textarea> <br><br>\
		<div id="StartScript"> \
		<input type="submit" value="Rozpocznij prace skryptu" onClick="startSctipt();">\
		<input type="submit" value="Wyświetl tabele" onClick="showDialogWithTable();">\
		<input type="submit" value="Wyświetl liste" onClick="showDialogWithCoords();">\
		</div> <div id=userInfomations> </div>';
		displayAlliesInDialog(allyNames.friendAlly,'FriendsAllies',removeFriendAlly.name)
		displayAlliesInDialog(allyNames.enemyAlly,'EnemyAllies',removeEnemyAlly.name)
	}
}
function showDialogWithTable(){
	Dialog.show("okienko",forumTable);
}
function showDialogWithCoords(){
	Dialog.show("okienko",listOfVillages);
}
function deleteIgnoredVillagesFromList(){
	var ingoredVillagesStringArray = ingoredVillages.split(";");
	ingoredVillagesStringArray.forEach(function(coord) {
		coords = getCoordFromSting(coord.replace("|",""));
		for (villageIndex = enemyVillages.length - 1; villageIndex >= 0 ; villageIndex--){
			if(coords.x == enemyVillages[villageIndex].x && coords.y == enemyVillages[villageIndex].y){
				enemyVillages.splice(villageIndex,1)
			}
		}	
	});
}
$('textarea').on({input: function(){
	var totalHeight = $(this).prop('scrollHeight') - parseInt($(this).css('padding-top')) - parseInt($(this).css('padding-bottom'));
	$(this).css({'height':totalHeight});
}
});
function resetVariables(){
	forumTable = "";
	friendPlayersWithVillages = [];
	enemyVillages = [];
	listOfVillages = [];
}
function getCoordFromSting(stringCoords){
	return {
				x: parseInt(stringCoords.toString().substr(0, 3)),
				y: parseInt(stringCoords.toString().substr(3))
			}
}
function startSctipt(allyNames){
		if (location.href.match('screen=map')){
			resetVariables();	
			minDistance = document.getElementById("minDistance").value;
			ingoredVillages = document.getElementById("ingoredVillages").value;
			document.getElementById("userInfomations").innerHTML = "<h2>Zaczekaj na zakończenie pracy skryptu</h2>";
			Object.keys(TWMap.villages).forEach(function(data) {
				village =  TWMap.villages[data];
				coord = getCoordFromSting(village.xy);
				page = getVillagePageAndAddToLists(createUrl(village.id),coord);
			});
			$(document).ajaxStop(function() {
				$(this).unbind("ajaxStop"); 
				deleteIgnoredVillagesFromList();
				fillDistanceEachPlayers();
				createTableAndList();
				document.getElementById("userInfomations").innerHTML = "";
				showDialogWithTable();
			})
		}
		else{
			document.getElementById("userInfomations").innerHTML = "<h2>Przejdz na strone z mapą</h2>";
		}
}
showPrompt();