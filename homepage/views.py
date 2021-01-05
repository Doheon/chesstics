from django.shortcuts import render

# Create your views here.
from django.shortcuts import render, HttpResponse, redirect
from .models import Chess

import pandas as pd
import simplejson as json


df = pd.DataFrame(list(Chess.objects.all().values()))
# +, # 없애줌
moves = df['moves'].str.split(" ")
for j, m in enumerate(moves):
    for i, n in enumerate(m):
        if n[-1] == "+" or n[-1] == "#":
            m[i] = n[:-1]
    moves[j] = " ".join(m)

df['moves'] = moves

white_win = df['winner'].apply(lambda x: ((x=='white') + (x!='black'))/2)
df['white_win'] = white_win
allCount = df["id"].count()

def updateDF(id, winner, moves):
    global df, allCount
    white_win = ((winner == "white") + (winner != "black"))/2
    moves = moves.split(" ")
    for i, n in enumerate(moves):
        if n[-1] == "+" or n[-1] == "#":
            moves[i] = n[:-1]

    moves = " ".join(moves)

    newdata = {"id": id, "winner":winner, "moves": moves, "white_win": white_win}
    df = df.append(newdata, ignore_index = True)
    allCount += 1


#통계에 있는 다음 수 중 count이상 나온 수들을 list로 반환
def nextMove(notation, count):
    l = len(notation)
    df2 = df.copy()
    df2 = df2[df2['moves'].str.slice(start=0, stop=l) == notation]
    df2['moves'] = df2['moves'].str.slice(start=l).str.strip()

    moves = df2['moves'].str.split(" ")
    next_move = moves.apply(lambda x: x[:1])
    next_move = next_move.apply(lambda x: "".join(x))
    df2['next_move'] = next_move

    grouped_count = df2[['white_win', 'next_move']].groupby('next_move').count()
    countSum = grouped_count["white_win"].sum()


    grouped_sum = df2[['white_win', 'next_move']].groupby('next_move').sum()

    grouped = grouped_sum[grouped_count>=count] / grouped_count[grouped_count >= count]
    grouped = grouped.dropna(axis = 0)
    grouped = grouped.sort_values(by = "white_win", ascending = False)
    
    grouped_count = grouped_count.sort_values(by = "white_win", ascending = False)

    grouped_key = grouped_count["white_win"].keys()
    l = len(grouped_count)
    most = []
    for i in range(7):
        if i<l :
            most.append([grouped_key[i], str(round(grouped_count["white_win"][grouped_key[i]]/countSum * 100,2)) + "%"])
        else:
            most.append([" "," "])

    return ([[i[0], i[1]] for i in grouped["white_win"].items() if i[0] != ''], most)

#해당 기보에서 백의 승률 반환
def whiteWin(notation):
    l = len(notation)
    df2 = df[["moves", "white_win"]]
    df2 = df2[df2["moves"].str.slice(start=0, stop=l)==notation]
    win_rate = df2["white_win"].mean()
    count = df2["white_win"].count()
    if count == 0:
        return ("n",0)
    return (win_rate, count)

#승률이 높은 순서로 7개의 수를 반환
def recommend(next_move):
    l = len(next_move)
    white_rn = []; white_rr = []; black_rn = []; black_rr = []

    for i in range(7):
        if i<l and next_move[i][0]:
            white_rn.append(next_move[i][0])
            white_rr.append(str(round(next_move[i][1]*100,2)) + "%")
        else:
            white_rn.append(" ")
            white_rr.append(" ")

        if i<l and next_move[-i-1][0]:
            black_rn.append(next_move[-i-1][0])
            black_rr.append(str(round(100 - next_move[-i-1][1]*100,2)) + "%")
        else:
            black_rn.append(" ")
            black_rr.append(" ")

    return (white_rn, white_rr, black_rn, black_rr)

def index(request):
    if request.method == "POST":
        notation = request.POST.get("notation","")
        return redirect('/search/' + notation)

    first_white_win = round((df["white_win"].mean()) * 100, 2)
    first_black_win = 100 - first_white_win
    rec, most = nextMove("",100)

    mn = [i[0] for i in most]
    mr = [i[1] for i in most]

    wrn,wrr,brn,brr = recommend(rec)

    return render(request, 'index.html', {"white":first_white_win, "black": first_black_win, "allCount":allCount, "wrn":wrn, "wrr":wrr, "brn":brn, "brr":brr, "mn": mn, "mr":mr})

def ajax(request):
    notation = request.POST.get('nota','')
    ismove = request.POST.get('ismove',True)

    notation = notation[1:]
    ans = whiteWin(notation)
    context = {}

    if ismove == "true":
        rec, most = nextMove(notation, 20)
        mn = [i[0] for i in most]
        mr = [i[1] for i in most]

        white_rn, white_rr, black_rn, black_rr = recommend(rec)
        context = {"win_rate":ans[0], "cases": str(ans[1]) + " / " + str(allCount), "white_rn": white_rn, "white_rr": white_rr, "black_rn": black_rn, "black_rr": black_rr, "mn":mn, "mr":mr}

    else:
        context = {"win_rate":ans[0]}
        

    return HttpResponse(json.dumps(context), content_type = "application/json")
    
def search(request, notation = ""):
    if request.method == "POST":
        notation = request.POST.get("notation","")
        return redirect('/search/' + notation)
    
    not_list = notation.split(" ")

    next_turn = "White" if len(not_list) % 2 == 0 else "Black"

    if notation == "":
        next_turn = "White"

    ans = whiteWin(notation)
    if ans[1]:
        white_win_rate = round(ans[0] *100,2)
        black_win_rate = round(100 - ans[0] *100,2)
    else:
        white_win_rate = "no data"
        black_win_rate = "no data"

    rec, most = nextMove(notation, 1)
    mn = [i[0] for i in most]
    mr = [i[1] for i in most]
    wrn,wrr,brn,brr = recommend(rec)

    if next_turn == "White":
        rn = wrn; rr = wrr
    else:
        rn = brn; rr = brr
    return render(request, 'search.html', {"white_win_rate":white_win_rate, "black_win_rate":black_win_rate,"cases": ans[1], "next_turn": next_turn, "notation": notation, "allCount":allCount, "rn":rn, "rr":rr, "mn": mn, "mr":mr})


def analysis(request, num=0):
    if request.method == "POST":
        notation = request.POST.get("notation","")
        return redirect('/search/' + notation)

    rec, most = nextMove("",100)
    mn = [i[0] for i in most]

    if num:
        src = 'analysis' + str(num) + ".html" 
        n = mn[num-1]
        x,y = nextMove(n, 100)
        mbn = [i[0] for i in y]
        mbr = [i[1] for i in y]
        mbwr = [str(round(100 - whiteWin(n +" "+ i[0])[0]*100,2)) + "%" for i in y]
        return render(request, src, {"mn": mn, "mbn": mbn, "mbr": mbr, "mbwr":mbwr})
        
    else :
        src = "analysis.html"
        mr = [i[1] for i in most]
        mwr = [str(round(whiteWin(i[0])[0] * 100,2)) + "%" for i in most]
        return render(request, src, {"mn": mn, "mr":mr, "mwr":mwr})


def add(request):    
    if request.method == "POST":
        notation = request.POST.get("notation",False)
        if notation:
            return redirect('/search/' + notation)

        last_id = Chess.objects.last().id
        winner = request.POST.get("winner","")
        notation = request.POST.get("addData","")

        Chess.objects.create(id = last_id + 1, winner = winner, moves = notation)
        updateDF(last_id+1, winner, notation)
        print(df)

    return render(request, 'add.html', {})