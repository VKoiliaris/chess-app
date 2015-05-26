// ... Squares collection
Squares = new Mongo.Collection("squares");

// letters arrays is used as a tool to convert the chess positions to a two dimensional array
var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ];

// the chessboard array, will be used for legal movement prior to changing the DB
var chessBoard = [
  ['wr', 'wkn', 'wb', 'wq', 'wk', 'wb', 'wkn', 'wr'],
  ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
  ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
  ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
  ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
  ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
  ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
  ['br', 'bkn', 'bb', 'bq', 'bk', 'bb', 'bkn', 'br']
];
// convert the chess syntax to table iterators
chessBoard.convert = function(position){
  var row = position[0] - 1;
  var column;
  for (var i = 0; i < 8; i++ ){
    if (position[1] === letters[i]){ column = i;}
  }
  var convertedPosition = [row, column];
  return convertedPosition;
};
// update method to be used when a change in the board will occur
chessBoard.update = function(oldPosition, newPosition){
  var oldPositionConverted = chessBoard.convert(oldPosition);
  var newPositionConverted = chessBoard.convert(newPosition);
  var eatenPiece = chessBoard[newPositionConverted[0]][newPositionConverted[1]];
  chessBoard[newPositionConverted[0]][newPositionConverted[1]] = chessBoard[oldPositionConverted[0]][oldPositionConverted[1]] ;
  chessBoard[oldPositionConverted[0]][oldPositionConverted[1]] = 'empty';
  return eatenPiece;
};
// restore is a function the basically restore the board as it was before the last update
chessBoard.restore = function(oldPosition, newPosition, pieceReplaced){
  var oldPositionConverted = chessBoard.convert(oldPosition);
  var newPositionConverted = chessBoard.convert(newPosition);
  chessBoard[newPositionConverted[0]][newPositionConverted[1]] = chessBoard[oldPositionConverted[0]][oldPositionConverted[1]] ;
  chessBoard[oldPositionConverted[0]][oldPositionConverted[1]] = pieceReplaced;
};
// blocked movement is a method that is invoked by the movement of pieces that can move on a line, but not over others
// and it returns whether the movement is obstructed
chessBoard.blockedMovement = function(kindOfMovement, startingPosition, finishPosition, kingThreat){
  var blocked = true;
  var line= []; // here we save the array strings we will check for vacancy
  line.empty = function include() { // with this funciton we make the check
    for (var i = 0; i < (line.length - 1); i++){
      if (line[i] !== 'empty'){
        return false;
      }
    }
    return true;
  };
  // now depending on the movement line type we separate them,
  // and in each if we iterate through the strings and add them to line[]
  if (kindOfMovement === "vertical"){
    var row = startingPosition[1];
    var startingColumn = startingPosition[0];
    var finishColumn = finishPosition[0];
    while(startingColumn !== finishColumn) {
      if (startingColumn > finishColumn){
        startingColumn--;
      }else{
        startingColumn++;
      }
      line.push(chessBoard[startingColumn][row]);
    }
    blocked = (!line.empty());
  }else if (kindOfMovement === 'horizontal'){
    var column = startingPosition[0];
    var startingRow = startingPosition[1];
    var finishRow = finishPosition[1];
    while(startingRow !== finishRow) {
      if (startingRow > finishRow){
        startingRow--;
      }else{
        startingRow++;
      }
      line.push(chessBoard[column][startingRow]);

    }
    blocked = (!line.empty());
  }else if (kindOfMovement === 'diagonalRising'){// diagonal rising is [1,1], [2,2]....
    var startingColumn = startingPosition[0];
    var finishColumn = finishPosition[0];
    var startingRow = startingPosition[1];
    var finishRow = finishPosition[1];
    while(startingRow !== finishRow) {
      if (startingRow > finishRow){
        startingRow--;
        startingColumn--;
      }else{
        startingRow++;
        startingColumn++;
      }
      line.push(chessBoard[startingColumn][startingRow]);
    }
    blocked = (!line.empty());
  }else if  (kindOfMovement === 'diagonalFalling'){// diagonal falling is [7,1], [6,2]....
    var startingColumn = startingPosition[0];
    var finishColumn = finishPosition[0];
    var startingRow = startingPosition[1];
    var finishRow = finishPosition[1];
    while(startingRow !== finishRow) {
      if (startingRow > finishRow){
        startingRow--;
        startingColumn++;
      }else{
        startingRow++;
        startingColumn--;
      }
      line.push(chessBoard[startingColumn][startingRow]);
    }
    blocked = (!line.empty());
  }
  if (!kingThreat){
    return blocked;
  }
  return line;

};

// pieces movements functions
chessBoard.wpMove = function(oldPosition, newPosition){// i separate the pawns movement white and black for convinience
  // here we save in teporary variables the values we will need for the comparisons
  var legal = false;
  var oldPositionConverted = chessBoard.convert(oldPosition);
  var oldColumn = oldPositionConverted[0];
  var oldRow = oldPositionConverted[1];
  var newPositionConverted = chessBoard.convert(newPosition);
  var newColumn = newPositionConverted[0];
  var newRow = newPositionConverted[1];
  if ((chessBoard[newColumn][newRow] === 'empty')&&(oldRow === newRow)){// if the new position is empty
    if (newColumn === (oldColumn + 1)){ // new position is the next square forward
      legal = true;
    }else if (((oldColumn === 1) && (newColumn === 3)) && (chessBoard[2][oldRow] === 'empty')){// if we are on the initial position and we jump 2 squares
      legal = true;
    }
  }else if (chessBoard[newColumn][newRow].slice(0,1) === 'b'){// if the square is occupied by a back piece
    if ((newColumn === (oldColumn +1)) && ((newRow ===(oldRow +1)) || (newRow ===(oldRow -1)))){
      legal = true;
    }
  }
//  if (legal){
//    chessBoard.update(oldPosition, newPosition);
//  }
  return legal;
};

chessBoard.bpMove = function(oldPosition, newPosition){
  // here we save in teporary variables the values we will need for the comparisons
  var legal = false;
  var oldPositionConverted = chessBoard.convert(oldPosition);
  var oldColumn = oldPositionConverted[0];
  var oldRow = oldPositionConverted[1];
  var newPositionConverted = chessBoard.convert(newPosition);
  var newColumn = newPositionConverted[0];
  var newRow = newPositionConverted[1];
  if ((chessBoard[newColumn][newRow] === 'empty')&&(oldRow === newRow)){// if the new position is empty
    if (newColumn === (oldColumn - 1)){ // new position is the next square forward
      legal = true;
    }else if (((oldColumn === 6) && (newColumn === 4)) && (chessBoard[5][oldRow] === 'empty')){// if we are on the initial position and we jump 2 squares
      legal = true;
    }
  }else if (chessBoard[newColumn][newRow].slice(0,1) === 'w'){// if the square is occupied by a back piece
    if ((newColumn === (oldColumn -1)) && ((newRow ===(oldRow -1)) || (newRow ===(oldRow +1)))){
      legal = true;
    }
  }
//  if (legal){
//    chessBoard.update(oldPosition, newPosition);
//  }
  return legal;
};

chessBoard.rMove = function(oldPosition, newPosition, kingView){
  // here we save in teporary variables the values we will need for the comparisons
  var legal = false;
  var oldPositionConverted = chessBoard.convert(oldPosition);
  var oldColumn = oldPositionConverted[0];
  var oldRow = oldPositionConverted[1];
  var newPositionConverted = chessBoard.convert(newPosition);
  var newColumn = newPositionConverted[0];
  var newRow = newPositionConverted[1];
  if (oldRow === newRow){
    if (!chessBoard.blockedMovement('vertical', oldPositionConverted, newPositionConverted, false)){
      legal = true;
    }
  }else if (oldColumn === newColumn){
    if (!chessBoard.blockedMovement('horizontal', oldPositionConverted, newPositionConverted, false)){
      legal = true;
    }
  }
//  if (legal && !kingView){// we make the update if the move is legal, and the ethod is not called be the king to check if he is threatened
//    chessBoard.update(oldPosition, newPosition);
//  }
  return legal;
};

chessBoard.knMove = function(oldPosition, newPosition, kingView){
  // here we save in teporary variables the values we will need for the comparisons
  var legal = false;
  var oldPositionConverted = chessBoard.convert(oldPosition);
  var oldColumn = oldPositionConverted[0];
  var oldRow = oldPositionConverted[1];
  var newPositionConverted = chessBoard.convert(newPosition);
  var newColumn = newPositionConverted[0];
  var newRow = newPositionConverted[1];
  if ((Math.abs(newColumn - oldColumn) === 2) && (Math.abs(newRow - oldRow) === 1)){
    legal = true;
  }else if ((Math.abs(newRow - oldRow) === 2) && (Math.abs(newColumn - oldColumn) === 1)){
    legal = true;
  }
//  if (legal && !kingView){
//    chessBoard.update(oldPosition, newPosition);
//  }
  return legal;
};

chessBoard.bMove = function(oldPosition, newPosition, kingView){
  // here we save in teporary variables the values we will need for the comparisons
  var legal = false;
  var oldPositionConverted = chessBoard.convert(oldPosition);
  var oldColumn = oldPositionConverted[0];
  var oldRow = oldPositionConverted[1];
  var newPositionConverted = chessBoard.convert(newPosition);
  var newColumn = newPositionConverted[0];
  var newRow = newPositionConverted[1];
  if ((oldColumn - oldRow) === (newColumn - newRow)){
    if (!chessBoard.blockedMovement('diagonalRising', oldPositionConverted, newPositionConverted, false)){
      legal = true;
    }
  }else if ((oldColumn + oldRow) === (newColumn + newRow)){
    if (!chessBoard.blockedMovement('diagonalFalling', oldPositionConverted, newPositionConverted, false)){
      legal = true;
    }
  }
//  if (legal && !kingView){
//    chessBoard.update(oldPosition, newPosition);
//  }
  return legal;
};

chessBoard.qMove = function(oldPosition, newPosition, kingView){
  // here we save in teporary variables the values we will need for the comparisons
  var legal = false;
  var oldPositionConverted = chessBoard.convert(oldPosition);
  var oldColumn = oldPositionConverted[0];
  var oldRow = oldPositionConverted[1];
  var newPositionConverted = chessBoard.convert(newPosition);
  var newColumn = newPositionConverted[0];
  var newRow = newPositionConverted[1];
  if ((oldColumn - oldRow) === (newColumn - newRow)){
    if (!chessBoard.blockedMovement('diagonalRising', oldPositionConverted, newPositionConverted, false)){
      legal = true;
    }
  }else if ((oldColumn + oldRow) === (newColumn + newRow)){
    if (!chessBoard.blockedMovement('diagonalFalling', oldPositionConverted, newPositionConverted, false)){
      legal = true;
    }
  }else if (oldRow === newRow){
    if (!chessBoard.blockedMovement('vertical', oldPositionConverted, newPositionConverted, false)){
      legal = true;
    }
  }else if (oldColumn === newColumn){
    if (!chessBoard.blockedMovement('horizontal', oldPositionConverted, newPositionConverted, false)){
      legal = true;
    }
  }
//  if (legal && !kingView){
//    chessBoard.update(oldPosition, newPosition);
//  }
  return legal;
};

chessBoard.kMove = function(oldPosition, white, firstMove, newPosition, kingView){
  // here we save in teporary variables the values we will need for the comparisons
  var legal = false;
  var oldPositionConverted = chessBoard.convert(oldPosition);
  var oldColumn = oldPositionConverted[0];
  var oldRow = oldPositionConverted[1];
  var newPositionConverted = chessBoard.convert(newPosition);
  var newColumn = newPositionConverted[0];
  var newRow = newPositionConverted[1];
  if ((Math.abs(newColumn - oldColumn) <= 1) && (Math.abs(newRow - oldRow) <= 1)){
    legal = true;
// Castling moves
  }else if ((firstMove) && (white)){
    if((newColumn === 0) && (newRow === 6) && (Squares.findOne({position: '1h'}).piece.firstMove === true)){
      if (!chessBoard.blockedMovement('horizontal', oldPositionConverted, [0,7], false)){
        legal = true;
        Meteor.call('replace', Squares.findOne({position: '1h'}).piece, '1f', true);
      }
    }else if ((newColumn === 0) && (newRow === 2) && (Squares.findOne({position: '1a'}).piece.firstMove === true)){
      if (!chessBoard.blockedMovement('horizontal', oldPositionConverted, [0,0], false)){
        legal = true;
        Meteor.call('replace', Squares.findOne({position: '1a'}).piece, '1d', true);
      }
    }
  }else if ((firstMove) && (!white)){
    if((newColumn === 7) && (newRow === 6) && (Squares.findOne({position: '8h'}).piece.firstMove === true)){
      if (!chessBoard.blockedMovement('horizontal', oldPositionConverted, [7,7], false)){
        legal = true;
        Meteor.call('replace', Squares.findOne({position: '8h'}).piece, '8f', true);
      }
    }else if ((newColumn === 7) && (newRow === 2) && (Squares.findOne({position: '8a'}).piece.firstMove === true)){
      if (!chessBoard.blockedMovement('horizontal', oldPositionConverted, [7,0], false)){
        legal = true;
        Meteor.call('replace', Squares.findOne({position: '8a'}).piece, '8d', true);
      }
    }
  }
//  if (legal && !kingView){
//   chessBoard.update(oldPosition, newPosition);
//  }
  return legal;
};
// function that check for threats to the king
chessBoard.kThreatened = function(piece, newPosition){
  var pieceEaten = chessBoard.update(piece.pPosition, newPosition);
  var king;
  var enemyQueen;
  var enemyKnight;
  var enemyRook;
  var enemyBishop;
  var enemyKing;
  var threatened = false;
  var white = piece.white;
  if (white){
    king = 'wk';
    enemyKing = 'bk';
    enemyBishop = 'bb';
    enemyRook = 'br';
    enemyQueen = 'bq';
    enemyKnight = 'bkn';
  }else{
    king = 'bk';
    enemyKing = 'wk';
    enemyBishop = 'wb';
    enemyRook = 'wr';
    enemyQueen = 'wq';
    enemyKnight = 'wkn';
  }
  // first we find the king
  for (var i = 0; i < 8; i ++){
    for (var j = 0; j < 8; j ++){
      if (chessBoard[i][j] === king){
        kingRow = i;
        kingColumn = j;
       }
    }
  }
  var convertedKingPosition = (kingRow+1) + letters[kingColumn];
  var convertedEnemyPosition;
  // and then we search for the enemy pieces and call their movements to check if they threaten the king
  for (var i = 0; i < 8; i ++){
    for (var j = 0; j < 8; j ++){
      if (chessBoard[i][j] === enemyKing){
        convertedEnemyPosition = (i+1) +  letters[j];
        var threatenedByKing = chessBoard.kMove(convertedEnemyPosition, white, false, convertedKingPosition, true);
      }else if (chessBoard[i][j] === enemyQueen){
        convertedEnemyPosition = (i+1) +  letters[j];
        var threatenedByQueen = chessBoard.qMove(convertedEnemyPosition, convertedKingPosition, true);
      }else if (chessBoard[i][j] === enemyKnight){
        convertedEnemyPosition = (i+1) +  letters[j];
        var threatenedByKnight = chessBoard.knMove(convertedEnemyPosition, convertedKingPosition, true);
      }else if (chessBoard[i][j] === enemyRook){
        convertedEnemyPosition = (i+1) +  letters[j];
        var threatenedByRook = chessBoard.rMove(convertedEnemyPosition, convertedKingPosition, true);
      }else if (chessBoard[i][j] === enemyBishop){
        convertedEnemyPosition = (i+1) +  letters[j];
        var threatenedByBishop = chessBoard.bMove(convertedEnemyPosition, convertedKingPosition, true);
      }
    }
  }
  // pawns threatening the king
  var threatenedByPawn = false;
  if (white){
    if ((chessBoard[kingRow+1][kingColumn-1] === 'bp') || (chessBoard[kingRow+1][kingColumn+1] === 'bp')){
      threatenedByPawn = true;
    }
  }else if (!white){
    if ((chessBoard[kingRow-1][kingColumn-1] === 'wp') || (chessBoard[kingRow-1][kingColumn+1] === 'wp')){
      threatenedByPawn = true;
    }
  }
  if (threatenedByPawn || threatenedByBishop || threatenedByRook || threatenedByKnight || threatenedByQueen || threatenedByKing){
    threatened = true;
  }
  console.log ("pawn threatens: ", threatenedByPawn, "bishop threatens: ", threatenedByBishop, "rook threatens: ", threatenedByRook, "knight threatens: ", threatenedByKnight, "queen threatens: ", threatenedByQueen, "king Threatens: ", threatenedByKing)
  chessBoard.restore(newPosition, piece.pPosition, pieceEaten);
  return threatened;
};

// constructor for the piece chosen
var pieceChosenCon = function(){
  obj = {
    symbol: null,
    pPosition : null
  };
  return obj;
};

// constructors for all the pieces
var wr= function(position){
  obj={
      symbol: 'wr',
      white: true,
      pPosition: position,
      pieceImage: '\u2656',
      firstMove: true
  };
  return obj;
};

var wkn= function(position){
  obj={
    symbol: 'wkn',
    white: true,
    pPosition: position,
    pieceImage: '\u2658'
  };
  return obj;
};

var wb= function(position){
  obj={
    symbol: 'wb',
    white: true,
    pPosition: position,
    pieceImage: '\u2657'
   };
  return obj;
};

var wq= function(position){
  obj={
    symbol: 'wq',
    white: true,
    pPosition: position,
    pieceImage: '\u2655',
    threatened: false
  };
  return obj;
};

var wk= function(position){
  obj={
    symbol: 'wk',
    white: true,
    pPosition: position,
    pieceImage: '\u2654',
    threatened: false,
    firstMove: true
  };
  return obj;
};

var wp= function(position){
  obj={
    symbol: 'wp',
    white: true,
    pPosition: position,
    pieceImage: '\u2659'
  };
  return obj;
};

var bp= function(position){
  obj={
    symbol: 'bp',
    white: false,
    pPosition: position,
    pieceImage: '\u265F'
  };
  return obj;
};

var br= function(position){
  obj={
    symbol: 'br',
    white: false,
    pPosition: position,
    pieceImage: '\u265C',
    firstMove: true
  };
  return obj;
};

var bkn= function(position){
  obj={
    symbol: 'bkn',
    white: false,
    pPosition: position,
    pieceImage: '\u265E'
  };
  return obj;
};

var bb= function(position){
  obj={
    symbol: 'bb',
    white: false,
    pPosition: position,
    pieceImage: '\u265D'
  };
  return obj;
};

var bq= function(position){
  obj={
    symbol: 'bq',
    white: false,
    pPosition: position,
    pieceImage: '\u265B',
    threatened: false
  };
  return obj;
};

var bk= function(position){
  obj={
    symbol: 'bk',
    white: false,
    pPosition: position,
    pieceImage: '\u265A',
    threatened: false,
    firstMove: true
  };
  return obj;
};


// client side
if (Meteor.isClient) {
  // setting up the white captured and black captured
  Session.setDefault("whiteCaptured",'');
  Session.setDefault("blackCaptured",'');
  Session.setDefault("players", '');

    Template.body.helpers({

// table rows
      row1: function(){
       return Squares.find({
          position: {$in: ["1a", "1b", "1c", "1d", "1e", "1f", "1g", "1h"]}
       });
      },
      row2: function(){
       return Squares.find({
          position: {$in: ["2a", "2b", "2c", "2d", "2e", "2f", "2g", "2h"]}
       });
      },
      row3: function(){
       return Squares.find({
          position: {$in: ["3a", "3b", "3c", "3d", "3e", "3f", "3g", "3h"]}
       });
      },
      row4: function(){
       return Squares.find({
          position: {$in: ["4a", "4b", "4c", "4d", "4e", "4f", "4g", "4h"]}
       });
      },
      row5: function(){
       return Squares.find({
          position: {$in: ["5a", "5b", "5c", "5d", "5e", "5f", "5g", "5h"]}
       });
      },
      row6: function(){
       return Squares.find({
          position: {$in: ["6a", "6b", "6c", "6d", "6e", "6f", "6g", "6h"]}
       });
      },
      row7: function(){
       return Squares.find({
          position: {$in: ["7a", "7b", "7c", "7d", "7e", "7f", "7g", "7h"]}
       });
      },
      row8: function(){
       return Squares.find({
          position: {$in: ["8a", "8b", "8c", "8d", "8e", "8f", "8g", "8h"]}
       });
      },
      // for the captured pieces, white side and black
      whiteCaptured: function(){
       return Session.get('blackSideCP');
      },
      blackCaptured: function(){
        return Session.get('whiteSideCP');
      },
      players: function(){
        return Session.get('playerList');
      }

  });

  Template.square.helpers({
      isOccupied: function(){ // return if the square is occupied
        return this.occupied;
      },

      isChosen: function(){ // we check which square is the chosen one by comparing its position to the piecechosen position
        return (this.position === pieceChosen.pPosition);
      },

      promotable: function(){ // nothing yet
        console.log((this.piece.symbol.slice(1,0) === 'p') && ((this.position.slice(0,1) === '1') || (this.position.slice(0,1) === '8')));
        return ((this.piece.symbol.slice(1,0) === 'p') && ((this.position.slice(0,1) === '1') || (this.position.slice(0,1) === '8')));
      }
  });

  Template.body.events({
    "submit .new-player": function (event) {
      // This function is called when the new player form is submitted
      var submitedName = event.target.text.value;
      if (playersList.length === 0){
        playersList.push({name: submitedName, side :'white', white: true});
      }else if (playersList.length === 1) {
         playersList.push({name: submitedName, side :'black', white: false});
      }else {
        playersList.push({name: submitedName, side :'observer', white: null});
      }

      // Clear form
      event.target.text.value = "";
      Session.set("playerList", playersList);
      // Prevent default form submit
      return false;
    },
  });

  Template.square.events({

    'click .occupied' : function (event) {
      var white = pieceChosen.white; // temporarily save the color of the piece
      Meteor.call('whoseTurn'); // we check the turn
      if (pieceChosen.symbol !==null){ // if there is a piece chosen
        if (this.piece.white === white){ // and the piece chosen's color is same as the new location piece color
          Meteor.call('toggleChosen', this.position, this.piece); //change the piece chosen with the new

        }else{ // if it is different,
          if (whiteTurn !== white){// if the turn side color is the same as the color of the chosen piece, the move is allowed, if not
            pieceChosen = {symbol: null, pPosition: null}; // the chosen piece is set to null
            white = pieceChosen.white; // as well as the temp variable for color
            Meteor.call('toggleChosen', this.position, this.piece);// and we toggle the chosen piece with the new position clicked
          }
          Meteor.call('movements', pieceChosen, this.position);// call movements with the new to check if the move abou to be taken is legal
          if (legalMove === true){
            Meteor.call('replace', pieceChosen, this.position, false); // replace = capture it
            if(white){ // here we update the html element that shows the captured pieces (white or black)
              Session.set("whiteSideCP", blackCapturedPieces);
            }else{
              Session.set("blackSideCP", whiteCapturedPieces);
            }
          }
      }
      }else{// if we do not have a piece chosen, and we click a piece we toggle the chosen state
        Meteor.call('toggleChosen', this.position, this.piece);

      }
    },

    'click .vacant' : function (event){ // if we click on a vacent square
      var white = pieceChosen.white; // temporarily save the color of the piece
      Meteor.call('whoseTurn'); // again we run to check the turn
      if (whiteTurn !== white){ // if it is not, we simply toggle the chosen piece with null
        Meteor.call('toggleChosen', this.position, this.piece);
        pieceChosen = {symbol: null, pPosition: null};
        white = pieceChosen.white;
      }
     Meteor.call('movements', pieceChosen, this.position); // check if th move is legal
      if (legalMove === true){
        Meteor.call('replace', pieceChosen, this.position, false); // we call replace (if we have a piece chosen the function runs , if not, nathing happens)
      }
    }
  });
}

// ... Server side

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

// ... methods

Meteor.methods({

  init: function(){ // we initiate the app
    Squares.remove({}); // remove the old objects in the DB
    blackCapturedPieces = []; // we declare the variables we will want
    whiteCapturedPieces = [];
    playersList = []; // players obj array
    turn = 0; // what turn we are on
    whiteTurn = false; // boolean variable to make comparisons for the turn (I used boolean so that the coparisons can be faster)
    pieceChosen = pieceChosenCon();
    legalMove = false;
    chess =chessBoard;
    for (var i = 0; i < 8; i++){// we create and add the document to the DB (empty squares)
      for (var j = 0; j < 8; j++){
        Squares.insert({
          position: i + 1 + letters[j] ,
          occupied: false,
          chosen: false,
          piece: {}
        });
      }
    }
  },

  whoseTurn : function(){
    if ((turn % 2) === 0){
      whiteTurn = true;
    }else {
      whiteTurn = false;
    }
  },

  movements : function(piece, newPosition){ // not implemented yet
    var legal = false;
    var legalAfterKingCheck = false;
    var symbol = piece.symbol;
    if (symbol === 'wp'){
      legal = chess.wpMove(piece.pPosition, newPosition);
    }else if (symbol === 'bp'){
      legal = chess.bpMove(piece.pPosition, newPosition);
    }else if ((symbol === 'wr') || (symbol === 'br')){
      legal = chess.rMove(piece.pPosition, newPosition, false);
    }else if ((symbol === 'wkn') || (symbol === 'bkn')){
      legal = chess.knMove(piece.pPosition, newPosition, false);
    }else if ((symbol === 'wb') || (symbol === 'bb')){
      legal = chess.bMove(piece.pPosition, newPosition, false);
    }else if ((symbol === 'wq') || (symbol === 'bq')){
      legal = chess.qMove(piece.pPosition, newPosition, false);
    }else if ((symbol === 'wk') || (symbol === 'bk')){
      legal = chess.kMove(piece.pPosition, piece.white, piece.firstMove, newPosition, false);
    }
    legalAfterKingCheck =  (!chess.kThreatened(piece, newPosition));

  //  console.log(legal);
    if ((legalAfterKingCheck === true) && (legal === true)){
      legalMove = true;
    }else{
      legalMove = false;
    }

  },

  replace: function(pieceToMove, newPosition, castling){ // the replace function moves the pieces, the last arguement is in case of castling moves
    var oldPosition = pieceToMove.pPosition;
    Squares.update({ // update the old position, (basicaly emptyng the square)
      position: oldPosition
    },
    {
      $set:{
        occupied: false,
        chosen: false,
        piece: {}
      }
    });
    pieceToMove.pPosition = newPosition;
    var temporarySquare = Squares.findOne({position: newPosition}); // get the square and save it to a temporary var
    if (temporarySquare.occupied === true){ // here if the new position has a piece, we capture it, updating the arrays of capture pieces
      if(temporarySquare.piece.white === true){
        whiteCapturedPieces.push(temporarySquare.piece);
      }else{
        blackCapturedPieces.push(temporarySquare.piece);
      }
    }
    if (pieceToMove.firstMove === true){ // tp check if it is a king or rook and change their first move fields
      pieceToMove.firstMove = false;
    }
    Squares.update({ // update the new square, and add the piece
      position: newPosition
    },
    {
      $set:{
        occupied: true,
        piece: pieceToMove
      }
    });
    chess.update(oldPosition, newPosition);
    if (!castling){
      pieceChosen = {symbol: null, pPosition: null}; // set the pieceChosen to null after capturing, if it is castling that calls it, do not change the chosen piece

      turn++;
    }
  },

   toggleChosen : function(squarePosition, pieceOnSquare){ // here we toggle the chosen value of square
    if (pieceChosen.pPosition === null){ // if there is no piece already chosen the clicked piece gets chosen
      Squares.update({
        position: squarePosition
      },
      {
        $set:{
         chosen: true
        }
      });
      pieceChosen = pieceOnSquare;
    }else if (pieceChosen.pPosition === pieceOnSquare.pPosition){ // if we have a piece chosen and we click on it again we "unchose" it
      Squares.update({
        position: squarePosition
      },
      {
        $set:{
         chosen: false
        }
      });
      pieceChosen = {symbol: null, pPosition: null};
    }else { // finaly if we choose another piece than the one we have chosen we change the chosen to the new
      Squares.update({
        position: pieceChosen.pPosition
      },
      {
        $set:{
         chosen: false
        }
      });
      Squares.update({
        position: squarePosition
      },
      {
        $set:{
         chosen: true
        }
      });
        pieceChosen = pieceOnSquare;
    }
  },

  populateBoard: function(){ // the function called after the init function, to populate the squares with the pieces
    var currentPossition; // temporary var so that i can save the location in chess syntax ("1a", "2h" etc.)
    for (var i = 0; i < 8; i++){ // it is used only for the pawns who can be added in a for loop
        currentPossition = 2 + letters[i];
        Squares.update({
          position: currentPossition
        },
        {
          $set:
          {
            occupied: true,
            piece: wp(currentPossition)
          }
        });
        currentPossition = 7 + letters[i];
        Squares.update({
          position: currentPossition
        },
        {
          $set:
          {
            occupied: true,
            piece: bp(currentPossition)
          }
        });
    }
    Squares.update({
      position: "1a"
    },
    {
      $set :
      {
        occupied: true,
        piece: wr("1a")
    }
    });

    Squares.update({
      position: "1h"
    },
    {
      $set :
      {
        occupied: true,
        piece: wr("1h")
    }
    });

    Squares.update({
      position: "1b"
    },
    {
      $set :
      {
        occupied: true,
        piece: wkn("1b")
    }
    });

    Squares.update({
      position: "1g"
    },
    {
      $set :
      {
        occupied: true,
        piece: wkn("1g")
    }
    });

    Squares.update({
      position: "1c"
    },
    {
      $set :
      {
        occupied: true,
        piece: wb("1c")
    }
    });

    Squares.update({
      position: "1f"
    },
    {
      $set :
      {
        occupied: true,
        piece: wb("1f")
    }
    });

    Squares.update({
      position: "1d"
    },
    {
      $set :
      {
        occupied: true,
        piece: wq( "1d")
    }
    });

    Squares.update({
      position: "1e"
    },
    {
      $set :
      {
        occupied: true,
        piece: wk("1e")
    }
    });


    Squares.update({
      position: "8a"
    },
    {
      $set :
      {
        occupied: true,
        piece: br("8a")
    }
    });

    Squares.update({
      position: "8h"
    },
    {
      $set :
      {
        occupied: true,
        piece: br("8h")
    }
    });

    Squares.update({
      position: "8b"
    },
    {
      $set :
      {
        occupied: true,
        piece: bkn("8b")
    }
    });

    Squares.update({
      position: "8g"
    },
    {
      $set :
      {
        occupied: true,
        piece: bkn("8g")
    }
    });

    Squares.update({
      position: "8c"
    },
    {
      $set :
      {
        occupied: true,
        piece: bb("8c")
    }
    });

    Squares.update({
      position: "8f"
    },
    {
      $set :
      {
        occupied: true,
        piece: bb("8f")
    }
    });

    Squares.update({
      position: "8d"
    },
    {
      $set :
      {
        occupied: true,
        piece: bq("8d")
    }
    });

    Squares.update({
      position: "8e"
    },
    {
      $set :
      {
        occupied: true,
        piece: bk("8e")
    }
    });
  }

});


Meteor.call('init');
Meteor.call('populateBoard');
