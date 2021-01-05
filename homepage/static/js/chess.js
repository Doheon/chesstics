const board = [];
const boardElement = document.getElementById("board");
const bodyElement = document.body;

let notation = "";
let turn = true;

let move_list = [];
let take_list = [];

let move_ref = "default"; //움직일 기물의 레퍼런스
let move_val; //움직일 기물의 값

let revert_before, revert_after, revert_save;
let canrevert = false;


function makeBoard(){
    for(var x=8; x>=0; x--){
        var row = [];
        for(var y = 0; y < 9; y++){
            var cell = {};
            cell.element = document.createElement("div");
            cell.color = "n";cell.piece = "n";cell.state = "n";cell.rate = "n";
            cell.name = String.fromCharCode(y+96) + x
            const cx = x, cy = y;
            cell.element.onclick = function(){clickBoard(cx, cy)};

            if (x==0 && y==0){
                cell.element.className = "coord";
                // cell.element.hidden = x;
            }
            else if (y == 0){
                cell.element.className = "coord";
                cell.element.style.textAlign = "right";
                cell.element.innerHTML =  x + "&nbsp;&nbsp;";
            }
            else if (x == 0){
                cell.element.className = "coord";
                cell.element.style.lineHeight = "3";
                cell.element.innerHTML = String.fromCharCode(y+96);
            }
            else if(y%2 == x%2) {
                cell.element.className = "white";
            }

            else {
                cell.element.className = "black";
            }
            boardElement.appendChild(cell.element);
            row.push(cell);
        }
        board.unshift(row);
    }

    //pawn
    for(var i=1; i<9; i++){
        putPiece(2,i,"w","p","cur");
        putPiece(7,i,"b","p","cur");
    }
    //rook
    putPiece(1,1,"w","R","cur");
    putPiece(1,8,"w","R","cur");
    putPiece(8,1,"b","R","cur");
    putPiece(8,8,"b","R","cur");

    //knight
    putPiece(1,2,"w","N","cur");
    putPiece(1,7,"w","N","cur");
    putPiece(8,2,"b","N","cur");
    putPiece(8,7,"b","N","cur");

    //bishop
    putPiece(1,3,"w","B","cur");
    putPiece(1,6,"w","B","cur");
    putPiece(8,3,"b","B","cur");
    putPiece(8,6,"b","B","cur");

    //queen
    putPiece(1,4,"w","Q","cur");
    putPiece(8,4,"b","Q","cur");

    //king
    putPiece(1,5,"w","K","cur");
    putPiece(8,5,"b","K","cur");

    updateBoard();
}


function putPiece(x, y, color, piece, state){
    if (x<0 || x > 8 || y < 0 || y > 8) return false;


    var cell = board[x][y];


    var old= clone(cell);
    move_val = clone(move_ref);

    //예측 승률계산에서 같은 색이면 아무것도 안함
    if (state == "move" && old.state == "cur" && old.color == color) return false;
    
    //승률을 눌렀다면 이동. 이동할 기물이랑 다른 승률다지움
    if (old.state == "move" || old.state == "take"){
        
        move_list.push(move_ref);
        removeList();
    }

    cell.color = color;
    cell.piece = piece;
    cell.state = state;


    //예측 승률 계산
    if(state == "move"){
        //빈공간으로 갈때
        if(old.state == "n"){
            move_list.push(cell);

            var piecename = piece == "p"? "":piece;//폰은 따로 처리
            var nota = notation +  " " + piecename + cell.name;
            getRate(nota, cell, false);
        }
        //말을 잡았을때 (색이 달라야 잡기 가능)
        else if(old.state == "cur" && old.color != color) {
            cell.state = "take";
            cell.color = old.color;
            cell.piece = old.piece;

            take_list.push(cell);

            var piecename = piece == "p"? move_val.name[0]:piece;
            nota = notation + " " + piecename + "x" + cell.name;
            getRate(nota, cell, false);
            return false;
        }
    }
    // 기물을 잡는 이동은 따로 처리
    else if(state == "cur" && move_ref != "default" && old.state == "take"){ 
        cell.color = move_val.color;
        cell.piece = move_val.piece;

        updateBoard();
    }

    
    return true;
}

//깊은 복사
function clone(obj){
    var res = document.createElement("div");
    res.color = obj.color;
    res.state = obj.state;
    res.piece = obj.piece;
    res.name = obj.name;
    res.rate = obj.rate;
    return res;
}

function valCopy(obj1, obj2){
    obj1.color = obj2.color;
    obj1.state = obj2.state;
    obj1.piece = obj2.piece;
    obj1.rate = obj2.rate;
}

function removeList(){
    while (move_list.length > 0){
        var v = move_list.pop();
        v.state = "n";
        v.color = "n";
        v.piece = "n";
        v.rate = "n";
    }

    while (take_list.length>0){
        var v = take_list.pop();
        v.state = "cur";
        v.rate = "n";
    }
}

function updateBoard(){
    for(var i=1; i<9; i++){
        for(var j=1; j<9; j++){
            var cell = board[i][j];
            const img = new Image();
            img.height = 50;
            cell.element.style.fontSize = "x-large"

            //기물
            if(cell.state == "cur"){
                var key = cell.color + cell.piece;
                img.src = piece_dic[key];
                cell.element.innerHTML = "";
                cell.element.appendChild(img);
            }

            //승률
            else if(cell.state == "move" || cell.state == "take"){

                if (cell.state == "move") cell.element.style.color = "rgb(36, 67, 169)";
                else if (cell.state == "take") cell.element.style.color = "rgb(191, 39, 22)";

                if(cell.rate == "n"){
                    cell.element.innerHTML = "no data";
                    cell.element.style.fontSize = "medium"
                }
                else{
                    if (turn) cell.element.innerHTML = cell.rate;
                    else cell.element.innerHTML = 100 - cell.rate;
                }
            }

            //나머지
            else{
                cell.element.innerHTML = "";
            }
        }
    }
}

function revert(){
    if (!canrevert){
        return;
    }
    removeList();
    canrevert = false;
    turn = !turn;

    valCopy(revert_before, clone(revert_after));
    valCopy(revert_after, revert_save);

    if (revert_after.state == "move") revert_after.state = "n";
    if (revert_after.state == "take") revert_after.state = "cur";

    var i = notation.length;
    while (notation[i-1] != " ") i--;
    notation = notation.slice(0,i-1);

    updateBoard();
    getRate(notation, "", true);
}


function clickBoard(x, y){
    const cell = board[x][y];

    //똑같은거 다시 눌렀을때
    if(cell.name == move_ref.name) {
        move_ref = "default";
        removeList();
        updateBoard();
    }

    //기물을 클릭했을때
    else if(cell.state == "cur" ){
        //움직일 말 저장후 승률들 다지움
        move_ref = cell;
        removeList();

        //pawn
        if(cell.piece == "p" && cell.color == "w" && turn){
            //move
            if(x+1 < 9 && board[x+1][y].state == "n") putPiece(x+1,y,"w", "p", "move");
            if(x == 2 && board[x+2][y].state == "n") putPiece(x+2,y,"w", "p", "move");

            //take
            if(x+1 <9 && y+1 < 9 && board[x+1][y+1].state == "cur") putPiece(x+1,y+1,"w", "p", "move");
            if(x+1 < 9 && y-1 > -1 && board[x+1][y-1].state == "cur") putPiece(x+1,y-1,"w", "p", "move");

        }
        else if(cell.piece == "p" && cell.color == "b" && !turn){
            //move
            if(x-1 > -1 && board[x-1][y].state == "n") putPiece(x-1,y,"b", "p", "move");
            if(x == 7 && board[x-2][y].state == "n") putPiece(x-2,y,"b", "p", "move");

            //take
            if(x-1 > -1 && y+1 <9 && board[x-1][y+1].state == "cur") putPiece(x-1,y+1,"b", "p", "move");
            if(x-1 > -1 && y-1 > -1 && board[x-1][y-1].state == "cur") putPiece(x-1,y-1,"b", "p", "move");
        }

        //rook
        if(cell.piece == "R" && ((cell.color == "w" && turn) || (cell.color == "b" && !turn))){
            var check = true, start = 1;
            while (check){
                check = putPiece(x+start,y, cell.color,"R","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x-start,y, cell.color,"R","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x,y+start, cell.color,"R","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x,y-start, cell.color,"R","move");
                start++;
            }
        }

        //knight
        if(cell.piece == "N" && ((cell.color == "w" && turn) || (cell.color == "b" && !turn))){
            var m = [[-2,1],[-2,-1],[-1,2],[-1,-2],[1,2],[1,-2],[2,1],[2,-1]];
            for (var _m of m){
                putPiece(x + _m[0], y + _m[1], cell.color, "N", "move");
            }
        }

        //bishop
        if(cell.piece == "B" && ((cell.color == "w" && turn) || (cell.color == "b" && !turn))){
            var check = true, start = 1;
            while (check){
                check = putPiece(x+start,y+start, cell.color,"B","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x-start,y-start, cell.color,"B","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x-start,y+start, cell.color,"B","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x+start,y-start, cell.color,"B","move");
                start++;
            }
        }

        //queen
        if(cell.piece == "Q" && ((cell.color == "w" && turn) || (cell.color == "b" && !turn))){
            var check = true, start = 1;
            while (check){
                check = putPiece(x+start,y, cell.color,"Q","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x-start,y, cell.color,"Q","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x,y+start, cell.color,"Q","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x,y-start, cell.color,"Q","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x+start,y+start, cell.color,"Q","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x-start,y-start, cell.color,"Q","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x-start,y+start, cell.color,"Q","move");
                start++;
            }

            check = true, start = 1;
            while (check){
                check = putPiece(x+start,y-start, cell.color,"Q","move");
                start++;
            }
        }

        //king
        if(cell.piece == "K" && ((cell.color == "w" && turn) || (cell.color == "b" && !turn))){
            var m = [[1,-1],[1,0],[1,1],[0,1],[0,-1],[-1,-1],[-1,0],[-1,1]];
            for (var _m of m){
                putPiece(x + _m[0], y + _m[1], cell.color, "K", "move");
            }
        }
    }

    //확률을 클릭했을때(이동)
    else if(cell.state == "move" || cell.state == "take"){
        var oldstate = cell.state;

        //이동
        canrevert = true;
        revert_before = move_ref;
        revert_after = board[x][y];
        revert_save = clone(board[x][y]);

        putPiece(x,y, cell.color, cell.piece, "cur");
        updateBoard();

        //보드의 현재 notation, turn 업데이트

        if(oldstate == "move") {
            var piecename = cell.piece == "p"? "":cell.piece;
            notation += " " + piecename + cell.name;
        }
    
        else if(oldstate == "take") {
            var piecename = cell.piece == "p"? move_val.name[0]:cell.piece;
            notation += " " + piecename + "x" + cell.name;
        }
        turn = !turn;

        getRate(notation, "", true);
    }
}