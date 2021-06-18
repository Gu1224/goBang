/**
 * 游戏模块
 */
class game {
    constructor(board, option) {
        /** 棋盘 **/
        this.board = board;
        /** 棋子数目 **/
        this.pieceNumber = 1;
        /** 棋子标准半径 **/
        this.radius = 15;
        /** 是否允许点击 **/
        this.isAllowClick = false;
        /** 是否游戏结束 **/
        this.gameOver = false;
        /** 是否普通模式 **/
        this.isNormalRule = false;
        /** 是否禁手模式 **/
        this.isForbiddenRule = false;
        /** json保存当前下子棋谱 **/
        this.goBangJson = {};
        /** 数组保存所有下子棋谱 **/
        this.goBangJsonArray = [];
        /** 价值数组 **/
        this.tipsArrayList = [];
        /** 游戏结果 **/
        this.result = null;
    }

    /**
     * 判断游戏模式
     * @param mode
     */
    gameMode(mode) {
        this.isNormalRule = false;
        this.isForbiddenRule = false;

        if (mode === 'normalRuleMode') {
            this.isNormalRule = true;
        } else if (mode === 'forbiddenRuleMode') {
            this.isForbiddenRule = true;
        }
        this.isAllowClick = true;
    }

    /**
     * 返回鼠标点击位置的棋子标准位置
     * @param event
     * @returns {*}
     */
    getStandardPos(event) {
        let mouseX = event.offsetX;
        let mouseY = event.offsetY;
        if (mouseX < this.board.narrowFrameWidth - this.radius ||
            mouseX > this.board.canvasWidth - this.board.wideFrameWidth + this.radius ||
            mouseY < this.board.narrowFrameWidth - this.radius ||
            mouseY > this.board.canvasHeight - this.board.wideFrameWidth + this.radius) {
            return -99;
        }
        let XGapNum = Math.round(Number((mouseX - this.board.narrowFrameWidth) / this.board.xGapSize));
        let YGapNum = Math.round(Number((mouseY - this.board.narrowFrameWidth) / this.board.yGapSize));
        let standardX = this.board.narrowFrameWidth + XGapNum * this.board.xGapSize;
        let standardY = this.board.narrowFrameWidth + YGapNum * this.board.yGapSize;

        return {standardX: standardX, standardY: standardY, XGapNum: XGapNum, YGapNum: YGapNum};
    }

    /**
     * 开始下棋
     * @param event
     */
    startGame(event) {
        // 获取标准位置
        let standardPos = this.getStandardPos(event);
        // 鼠标点击位置为棋盘以外的位置 || 棋盘不允许点击
        if (standardPos === -99) {
            return;
        }
        if (!this.isAllowClick) {
            alert("请先选择游戏玩法");
            return;
        }
        // x轴标准坐标
        let x = standardPos.standardX;
        // y轴标准坐标
        let y = standardPos.standardY;
        // 列
        let column = standardPos.XGapNum;
        // 行
        let row = standardPos.YGapNum;
        // 本局未结束并可以触发事件
        if (!this.gameOver) {
            if (this.board.boardArray[row][column] === 0) {
                // 判断前三子下子情况
                if (this.getTheFirstFewHands(row, column) === true) {
                    return;
                }
                // 修改棋盘数组
                this.arrayAssignment(true, row, column);
                // 游戏模式判断
                if (this.isForbiddenRule) {
                    // 有禁模式
                    let getResult = this.startForbiddenRuleMode(row, column);
                    // 有禁结果判断
                    if (getResult === 'fourForbidden' || getResult === 'threeForbidden' || getResult === 'longLink') {
                        // 重新修改棋盘数组
                        this.arrayAssignment(false, row, column);
                        return;
                    }
                } else {
                    // 普通模式
                    this.startNormalRuleMode(row, column);
                }
                // 画子
                this.drawGoBang(this.board.isBlack, x, y);
                // 保存棋谱
                this.saveRecord(row, column);
                // 下棋次数加一
                this.pieceNumber++;
                // 重绘
                this.redraw();
            }
        } else {
            alert('本局结束，请开始下一局');
        }
    }

    /**
     * 教学提示
     * @param tipsArrayList
     */
    teachingTips(tipsArrayList) {
        let row, column, tipsValue;
        let tipsCharacter = ['推荐', '较好', '一般'];
        this.tipsArrayList = tipsArrayList;
        for (let i = this.tipsArrayList.length - 1; i >= 0; i--) {
            if (i === 0) {
                this.tipsArrayList[i]['value'] = tipsCharacter[0];
            } else if (i === tipsArrayList.length - 1) {
                this.tipsArrayList[i]['value'] = tipsCharacter[2];
            } else {
                this.tipsArrayList[i]['value'] = tipsCharacter[1];
            }
            row = this.tipsArrayList[i].row;
            column = this.tipsArrayList[i].column;
            tipsValue = this.tipsArrayList[i].value;
            this.drawTipsBox(row, column, tipsValue);
        }
    }

    /**
     * 画提示框
     * @param row
     * @param column
     * @param tipsCharacter
     */
    drawTipsBox(row, column, tipsCharacter) {
        let ctx = this.board.canvas.getContext("2d");
        // 起始x坐标
        let x = this.board.narrowFrameWidth + column * this.board.xGapSize;
        // 起始y坐标
        let y = this.board.narrowFrameWidth + row * this.board.yGapSize;
        // 缩放
        ctx.scale(1, 1);
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - this.board.xGapSize / 3, y - this.board.yGapSize / 3);
        ctx.lineTo(x - this.board.xGapSize, y - this.board.yGapSize / 3);
        ctx.lineTo(x - this.board.xGapSize, y - this.board.yGapSize * 4 / 3);
        ctx.lineTo(x + this.board.xGapSize, y - this.board.yGapSize * 4 / 3);
        ctx.lineTo(x + this.board.xGapSize, y - this.board.yGapSize * 4 / 3);
        ctx.lineTo(x + this.board.xGapSize, y - this.board.yGapSize / 3);
        ctx.lineTo(x + this.board.xGapSize / 3, y - this.board.yGapSize / 3);
        // 阴影
        // ctx.shadowColor = 'rgba(0,0,0,0.2)';
        // ctx.shadowBlur = 5;
        // ctx.shadowOffsetX = 2;
        // ctx.shadowOffsetY = 2;
        // 透明度
        // ctx.globalAlpha = 0.95;
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.font = '11pt Arial';
        ctx.fillStyle = 'black';
        ctx.fillText(tipsCharacter, x - this.board.board.measureText(tipsCharacter).width / 2,
            y - this.board.yGapSize * 2 / 3);
        ctx.closePath();
    }

    /**
     * 画棋子
     */
    drawGoBang(isBlack, standardX, standardY) {
        let color;
        let ctx = this.board.canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(standardX, standardY, this.radius, Math.PI * 2, 0, false);
        ctx.closePath();
        if (isBlack) {
            color = "#000000";
            this.board.isBlack = false;
        } else {
            color = "#eae9e9";
            this.board.isBlack = true;
        }
        ctx.fillStyle = color;
        ctx.fill();
    }

    /**
     * 画十字架
     * @param row
     * @param column
     */
    drawCross(row, column) {
        let ctx = this.board.canvas.getContext("2d");
        // 起始x坐标
        let x = this.board.narrowFrameWidth + column * this.board.xGapSize;
        // 起始y坐标
        let y = this.board.narrowFrameWidth + row * this.board.yGapSize;
        ctx.strokeStyle = '#e84b4b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + this.board.xGapSize / 5, y);
        ctx.lineTo(x - this.board.xGapSize / 5, y);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + this.board.xGapSize / 5);
        ctx.lineTo(x, y - this.board.xGapSize / 5);
        ctx.closePath();
        ctx.stroke();
    }

    /**
     * 保存棋谱
     * @param row
     * @param column
     */
    saveRecord(row, column) {
        let who;
        let step = this.pieceNumber;
        if (this.board.boardArray[row][column] === 1) {
            who = "black";
        } else if (this.board.boardArray[row][column] === -1) {
            who = "white";
        }
        this.goBangJson = {"step": step, "who": who, "row": row, "column": column};
        this.goBangJsonArray.push(this.goBangJson);
    }

    /**
     * 获取棋谱数据
     * @param step
     */
    getRecord(step) {
        if (step <= this.pieceNumber - 1) {
            let who = this.goBangJsonArray[step - 1].who;
            let row = this.goBangJsonArray[step - 1].row;
            let column = this.goBangJsonArray[step - 1].column;
            return {"step": step, "who": who, "row": row, "column": column};
        } else {
            alert("当前只走了" + (this.pieceNumber - 1) + "步棋");
        }
    }

    /**
     * 普通规则模式
     * @param row
     * @param column
     */
    startNormalRuleMode(row, column) {
        // 判断下棋情况
        this.checkLinkResult(row, column);
        // 获得结果
        this.getResult();
    }

    /**
     * 禁手规则模式
     * @param row
     * @param column
     */
    startForbiddenRuleMode(row, column) {
        // 判断下棋情况
        this.checkLinkResult(row, column);
        if (this.board.isBlack) {
            // 判断下棋情况
            if (this.four(row, column, 1, 'e') > 1) {
                alert("此步为四四禁手");
                return 'fourForbidden';
            } else if (this.three(row, column, 1, 'e') > 1) {
                alert("此步为三三禁手");
                return 'threeForbidden';
            } else if (this.result === 'longLink') {
                alert('此步为长连禁手');
                this.result = null;
                return 'longLink';
            }
        }
        // 获得结果
        this.getResult();
    }

    /**
     * 获取前三手情况
     * @param row
     * @param column
     * @returns {boolean}
     */
    getTheFirstFewHands(row, column) {
        if (this.pieceNumber === 1) {
            // 判断首子是否在天元下首子
            if (row !== 7 || column !== 7) {
                alert("请在天元下子");
                return true;
            }
        } else if (this.pieceNumber === 2) {
            // 判断第二子是否在天元为中心邻近的八个点下子
            if (row < 6 || row > 8 || column < 6 || column > 8) {
                alert("请在天元为中心邻近的八个点下子");
                return true;
            }
        } else if (this.pieceNumber === 3) {
            // 判断第三子是否在天元为中心邻近5×5点上下子
            if (row < 2 || row > 12 || column < 2 || column > 12) {
                alert("请在天元为中心邻近5×5点上下子");
                return true;
            }
        }
        return false;
    }

    /**
     * 棋盘数组赋值
     * @param what
     * @param row
     * @param column
     */
    arrayAssignment(what, row, column) {
        if (!what) {
            this.board.boardArray[row][column] = 0;
        } else {
            if (this.board.isBlack) {
                this.board.boardArray[row][column] = 1;
            } else {
                this.board.boardArray[row][column] = -1;
            }
        }

    }

    /**
     * 获取当前棋盘连子状态
     * @param row
     * @param column
     */
    getCurLinkStatus(row, column) {
        // 竖向连子的数量
        let verticalSum = 1;
        // 横向连子的数量
        let horizontalSum = 1;
        // 左下到右上连子的数量
        let leftObliqueSum = 1;
        // 左上到右下连子的数量
        let rightObliqueSum = 1;
        let currentDate = this.board.boardArray[row][column];
        // 当前下子位置往上搜索
        for (let i = row - 1; i >= 0; i--) {
            if (this.board.boardArray[i][column] === currentDate) {
                verticalSum += 1;
            } else {
                break;
            }
        }
        // 当前下子位置往下搜索
        for (let j = row + 1; j <= 14; j++) {
            if (this.board.boardArray[j][column] === currentDate) {
                verticalSum += 1;
            } else {
                break;
            }
        }
        // 当前下子位置往左搜索
        for (let k = column - 1; k >= 0; k--) {
            if (this.board.boardArray[row][k] === currentDate) {
                horizontalSum += 1;
            } else {
                break;
            }
        }
        // 当前下子位置往右搜索
        for (let l = column + 1; l <= 14; l++) {
            if (this.board.boardArray[row][l] === currentDate) {
                horizontalSum += 1;
            } else {
                break;
            }
        }
        // 当前下子位置往左上方向搜索
        for (let m = row - 1, n = column - 1; m >= 0 && n >= 0; m--, n--) {
            if (this.board.boardArray[m][n] === currentDate) {
                leftObliqueSum += 1;
            } else {
                break;
            }
        }
        // 当前下子位置往右下方向搜索
        for (let o = row + 1, p = column + 1; o <= 14 && p <= 14; o++, p++) {
            if (this.board.boardArray[o][p] === currentDate) {
                leftObliqueSum += 1;
            } else {
                break;
            }
        }
        // 当前下子位置往左下方向搜索
        for (let q = column - 1, r = row + 1; q >= 0 && r <= 14; q--, r++) {
            if (this.board.boardArray[r][q] === currentDate) {
                rightObliqueSum += 1;
            } else {
                break;
            }
        }
        // 当前下子位置往右上方向搜索
        for (let s = column + 1, t = row - 1; s <= 14 && t >= 0; s++, t--) {
            if (this.board.boardArray[t][s] === currentDate) {
                rightObliqueSum += 1;
            } else {
                break;
            }
        }

        return {
            verticalSum: verticalSum,
            horizontalSum: horizontalSum,
            leftObliqueSum: leftObliqueSum,
            rightObliqueSum: rightObliqueSum
        };
    }

    /**
     * 检查连子情况
     * @param row
     * @param column
     */
    checkLinkResult(row, column) {
        let getCurLinStatus = this.getCurLinkStatus(row, column);
        let verticalSum = getCurLinStatus.verticalSum;
        let horizontalSum = getCurLinStatus.horizontalSum;
        let leftObliqueSum = getCurLinStatus.leftObliqueSum;
        let rightObliqueSum = getCurLinStatus.rightObliqueSum;
        if (this.board.boardArray[row][column] === 1) {
            // 长连禁手
            if (horizontalSum > 5 || verticalSum > 5 ||
                rightObliqueSum > 5 || leftObliqueSum > 5) {
                if (this.isForbiddenRule) {
                    this.result = 'longLink';
                } else if (this.isNormalRule) {
                    this.result = 'blackWin';
                }
            } else if (verticalSum === 5 || horizontalSum === 5 ||
                leftObliqueSum === 5 || rightObliqueSum === 5) {
                // 黑方连上5子
                this.result = 'blackWin';
            }
        } else {
            if (verticalSum >= 5 || horizontalSum >= 5 ||
                leftObliqueSum >= 5 || rightObliqueSum >= 5) {
                // 白方连上5子
                this.result = 'whiteWin';
            }
        }
    }

    /**
     * 获取游戏结果
     */
    getResult() {
        if (this.result === 'blackWin') {
            alert('黑方连五子，游戏结束');
            this.gameOver = true;
        } else if (this.result === 'whiteWin') {
            alert('白方连五子，游戏结束');
            this.gameOver = true;
        }
    }

    /**
     * 得结果之后画连线
     */
    drawCrossAfterGetResult() {
        let row, column;
        let goBangJsonArray = this.goBangJsonArray;
        let length = goBangJsonArray.length;
        row = goBangJsonArray[length - 1].row;
        column = goBangJsonArray[length - 1].column;
        let getCurLinStatus = this.getCurLinkStatus(row, column);
        let currentDate = this.board.boardArray[row][column];
        let verticalSum = getCurLinStatus.verticalSum;
        let horizontalSum = getCurLinStatus.horizontalSum;
        let leftObliqueSum = getCurLinStatus.leftObliqueSum;
        let rightObliqueSum = getCurLinStatus.rightObliqueSum;
        if (verticalSum >= 5) {
            for (let i = row; i >= 0; i--) {
                if (this.board.boardArray[i][column] === currentDate) {
                    this.drawCross(i, column);
                } else {
                    break;
                }
            }
            // 当前下子位置往下搜索
            for (let j = row; j <= 14; j++) {
                if (this.board.boardArray[j][column] === currentDate) {
                    this.drawCross(j, column);
                } else {
                    break;
                }
            }
        } else if (horizontalSum >= 5) {
            // 当前下子位置往左搜索
            for (let k = column; k >= 0; k--) {
                if (this.board.boardArray[row][k] === currentDate) {
                    this.drawCross(row, k);
                } else {
                    break;
                }
            }
            // 当前下子位置往右搜索
            for (let l = column; l <= 14; l++) {
                if (this.board.boardArray[row][l] === currentDate) {
                    this.drawCross(row, l);
                } else {
                    break;
                }
            }
        } else if (leftObliqueSum >= 5) {
            // 当前下子位置往左上方向搜索
            for (let m = row, n = column; m >= 0 && n >= 0; m--, n--) {
                if (this.board.boardArray[m][n] === currentDate) {
                    this.drawCross(m, n);
                } else {
                    break;
                }
            }
            // 当前下子位置往右下方向搜索
            for (let o = row, p = column; o <= 14 && p <= 14; o++, p++) {
                if (this.board.boardArray[o][p] === currentDate) {
                    this.drawCross(o, p);
                } else {
                    break;
                }
            }
        } else if (rightObliqueSum >= 5) {
            // 当前下子位置往左下方向搜索
            for (let q = column, r = row; q >= 0 && r <= 14; q--, r++) {
                if (this.board.boardArray[r][q] === currentDate) {
                    this.drawCross(r, q);
                } else {
                    break;
                }
            }
            // 当前下子位置往右上方向搜索
            for (let s = column, t = row; s <= 14 && t >= 0; s++, t--) {
                if (this.board.boardArray[t][s] === currentDate) {
                    this.drawCross(t, s);
                } else {
                    break;
                }
            }
        }
    }

    /**
     * 判断是否三三禁手
     * @param row
     * @param column
     * @param cenci
     * @param direction
     * @returns {number}
     */
    three(row, column, cenci, direction) {
        if (this.board.boardArray[row][column] === 1) {
            let i, j, count3 = 0;
            if (cenci === 1) {
                if (!this.isNotThree(row, column, 1, 'a')) {
                    return undefined;
                }
                // 判断纵向三
                for (i = 0; i < 11; i++) {
                    if (this.board.boardArray[i][column] + this.board.boardArray[i + 1][column] +
                        this.board.boardArray[i + 2][column] + this.board.boardArray[i + 3][column] === 3) {
                        count3++;
                        for (let l = 0; l < 5; l++) {
                            if (this.board.boardArray[i + l][column] === 1) {
                                count3 += this.three(i + l, column, 0, 'b');
                                if (count3 > 1) {
                                    return 2;
                                }
                            }
                        }
                        break;
                    }
                }
                // 判断横向三
                for (j = 0; j < 11; j++) {
                    if (this.board.boardArray[row][j] + this.board.boardArray[row][j + 1] +
                        this.board.boardArray[row][j + 2] + this.board.boardArray[row][j + 3] === 3) {
                        count3++;
                        for (let k = 0; k < 5; k++) {
                            if (this.board.boardArray[row][j + k] === 1) {
                                count3 += this.three(row, j + k, 0, 'a');
                                if (count3 > 1) {
                                    return 2;
                                }
                            }
                        }
                        break;
                    }
                }
                // 判断"\"向三三禁手
                if (column > row) {
                    for (i = 0, j = (column - row); i < (12 - column + row); i++, j++) {
                        if (this.board.boardArray[i][j] + this.board.boardArray[i + 1][j + 1] +
                            this.board.boardArray[i + 2][j + 2] + this.board.boardArray[i + 3][j + 3] === 3) {
                            count3++;
                            for (let m = 0; m < 5; m++) {
                                if (this.board.boardArray[i + m][j + m] === 1) {
                                    count3 += this.three(i + m, j + m, 0, 'c');
                                    if (count3 > 1) {
                                        return 2;
                                    }
                                }
                            }
                            break;
                        }
                    }
                } else {
                    for (i = (row - column), j = 0; i < 11; i++, j++) {
                        if (this.board.boardArray[i][j] + this.board.boardArray[i + 1][j + 1] +
                            this.board.boardArray[i + 2][j + 2] + this.board.boardArray[i + 3][j + 3] === 3) {
                            count3++;
                            for (let n = 0; n < 5; n++) {
                                if (this.board.boardArray[i + n][j + n] === 1) {
                                    count3 += this.three(i + n, j + n, 0, 'c');
                                    if (count3 > 1) {
                                        return 2;
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
                //判断"/"向三三
                if (column + row < 15) {
                    for (i = row + column, j = 0; i >= 4; i--, j++) {
                        if (this.board.boardArray[i][j] + this.board.boardArray[i - 1][j + 1] +
                            this.board.boardArray[i - 2][j + 2] + this.board.boardArray[i - 3][j + 3] === 3) {
                            count3++;
                            for (let o = 0; o < 5; o++) {
                                if (this.board.boardArray[i - o][j + o] === 1) {
                                    count3 += this.three(i - o, j + o, 0, 'd');
                                    if (count3 > 1) {
                                        return 2;
                                    }
                                }
                            }
                            break;
                        }
                    }
                } else {
                    for (i = 14, j = row + column; j < 11; i--, j--) {
                        if (this.board.boardArray[i][j] + this.board.boardArray[i - 1][j + 1] +
                            this.board.boardArray[i - 2][j + 2] + this.board.boardArray[i - 3][j + 3] === 3) {
                            count3++;
                            for (let p = 0; p < 5; p++) {
                                if (this.board.boardArray[i - p][j + p] === 1) {
                                    count3 += this.three(i - p, j - p, 0, 'd');
                                    if (count3 > 1) {
                                        return 2;
                                    }
                                }
                            }
                            break;
                        }
                    }
                }

                if (count3 > 1) {
                    return 2;
                }
            } else {
                if (direction !== 'a') {
                    //判断横向三
                    for (j = 0; j < 11; j++) {
                        if (this.board.boardArray[row][j] + this.board.boardArray[row][j + 1] +
                            this.board.boardArray[row][j + 2] + this.board.boardArray[row][j + 3] === 3) {
                            return 1;
                        }
                    }
                }
                if (direction !== 'b') {
                    // 判断纵向三
                    for (i = 0; i < 11; i++) {
                        if (this.board.boardArray[i][column] + this.board.boardArray[i + 1][column] +
                            this.board.boardArray[i + 2][column] + this.board.boardArray[i + 3][column] +
                            this.board.boardArray[i + 4][column] === 3) {
                            return 1;
                        }
                    }
                }
                if (direction !== 'c') {
                    if (column > row) {
                        // 判断“\”向
                        for (i = 0, j = column - row; i < (11 - column + row); i++, j++) {
                            if (this.board.boardArray[i][j] +
                                this.board.boardArray[i + 1][j + 1] +
                                this.board.boardArray[i + 2][j + 2] +
                                this.board.boardArray[i + 3][j + 3] === 3) {
                                return 1;
                            }
                        }
                    } else {
                        // 判断“\”向
                        for (i = row - column, j = 0; i < 11; i++, j++) {
                            if (this.board.boardArray[i][j] +
                                this.board.boardArray[i + 1][j + 1] +
                                this.board.boardArray[i + 2][j + 2] +
                                this.board.boardArray[i + 3][j + 3] === 3) {
                                return 1;
                            }
                        }
                    }
                }
                if (direction !== 'd') {
                    if (row + column < 15) {
                        // 判断“/”向“活三”
                        for (i = row + column, j = 0; i >= 3; i--, j++) {
                            if (this.board.boardArray[i][j] +
                                this.board.boardArray[i - 1][j + 1] +
                                this.board.boardArray[i - 2][j + 2] +
                                this.board.boardArray[i - 3][j + 3] === 3) {
                                return 1;
                            }
                        }
                    } else {
                        // 判断“/”向“活三”
                        for (i = 14, j = row + column - 14; j < 12; i--, j++) {
                            if (this.board.boardArray[i][j] +
                                this.board.boardArray[i - 1][j + 1] +
                                this.board.boardArray[i - 2][j + 2] +
                                this.board.boardArray[i - 3][j + 3] === 3) {
                                return 1;
                            }
                        }
                    }
                }
            }
        }
        return 0;
    }

    /**
     * 非三三禁手的特殊局势
     * @param row
     * @param column
     * @param cenci
     * @param direction
     */
    isNotThree(row, column, cenci, direction) {
        let result = true;
        if (row > 2 && row < 12 && column > 2 && column < 12 &&
            this.board.boardArray[row - 1][column - 1] === 1 &&
            this.board.boardArray[row - 3][column - 3] === -1 &&
            this.board.boardArray[row + 1][column - 1] === 1 &&
            this.board.boardArray[row + 2][column - 2] === 1 &&
            this.board.boardArray[row + 3][column + 3] === -1 &&
            this.board.boardArray[row + 1][column + 1] === 1) {
            result = false;
        } else if (row > 2 && row < 12 && column > 2 && column < 12 &&
            this.board.boardArray[row - 1][column + 1] === 1 &&
            this.board.boardArray[row - 3][column + 3] === -1 &&
            this.board.boardArray[row + 1][column + 1] === 1 &&
            this.board.boardArray[row + 2][column + 2] === 1 &&
            this.board.boardArray[row + 3][column - 3] === -1 &&
            this.board.boardArray[row + 1][column - 1] === 1) {
            result = false;
        } else if (row > 2 && row < 12 && column > 2 && column < 12 &&
            this.board.boardArray[row - 1][column - 1] === 1 &&
            this.board.boardArray[row - 3][column - 3] === -1 &&
            this.board.boardArray[row - 1][column + 1] === 1 &&
            this.board.boardArray[row - 2][column + 2] === 1 &&
            this.board.boardArray[row + 3][column + 3] === -1 &&
            this.board.boardArray[row + 1][column + 1] === 1) {
            result = false;
        } else if (row > 2 && row < 12 && column > 2 && column < 12 &&
            this.board.boardArray[row - 1][column + 1] === 1 &&
            this.board.boardArray[row - 3][column + 3] === -1 &&
            this.board.boardArray[row - 1][column - 1] === 1 &&
            this.board.boardArray[row - 2][column - 2] === 1 &&
            this.board.boardArray[row + 3][column - 3] === -1 &&
            this.board.boardArray[row + 1][column - 1] === 1) {
            result = false;
        }
        return result;
    }

    /**
     * 判断是否四四禁手
     * @param row 行坐标
     * @param column 列坐标
     * @param cenci 搜索层次（1为当前坐标的层次，0位当前坐标附近坐标的层次）
     * @param direction 搜索方向（’a'为横向；‘b’为纵向；‘column’为\向；‘d’为/向）
     * @returns {number}
     */
    four(row, column, cenci, direction) {
        if (this.board.boardArray[row][column] === 1) {
            let i, j, count4 = 0;
            if (cenci === 1) {
                // 判断横向四四
                for (j = 0; j < 11; j++) {
                    if (this.board.boardArray[row][j] + this.board.boardArray[row][j + 1] +
                        this.board.boardArray[row][j + 2] + this.board.boardArray[row][j + 3] +
                        this.board.boardArray[row][j + 4] === 4) {
                        count4++;
                        for (let k = 0; k < 5; k++) {
                            if (this.board.boardArray[row][j + k] === 1) {
                                count4 += this.four(row, j + k, 0, 'a');
                                if (count4 > 1) {
                                    return 2;
                                }
                            }
                        }
                        break;
                    }
                }
                // 判断纵向四四
                for (i = 0; i < 11; i++) {
                    if (this.board.boardArray[i][column] + this.board.boardArray[i + 1][column] +
                        this.board.boardArray[i + 2][column] + this.board.boardArray[i + 3][column] +
                        this.board.boardArray[i + 4][column] === 4) {
                        count4++;
                        for (let l = 0; l < 5; l++) {
                            if (this.board.boardArray[i + l][column] === 1) {
                                count4 += this.four(i + l, column, 0, 'b');
                                if (count4 > 1) {
                                    return 2;
                                }
                            }
                        }
                        break;
                    }
                }
                // 判断'\'向四四
                if (column > row) {
                    for (i = 0, j = (column - row); i < (11 - column + row); i++, j++) {
                        if (this.board.boardArray[i][j] + this.board.boardArray[i + 1][j + 1] +
                            this.board.boardArray[i + 2][j + 2] + this.board.boardArray[i + 3][j + 3] +
                            this.board.boardArray[i + 4][j + 4] === 4) {
                            count4++;
                            for (let m = 0; m < 5; m++) {
                                if (this.board.boardArray[i + m][j + m] === 1) {
                                    count4 += this.four(i + m, j + m, 0, 'c');
                                    if (count4 > 1) {
                                        return 2;
                                    }
                                }
                            }
                            break;
                        }
                    }
                } else {
                    for (i = (row - column), j = 0; i < 11; i++, j++) {
                        if (this.board.boardArray[i][j] + this.board.boardArray[i + 1][j + 1] +
                            this.board.boardArray[i + 2][j + 2] + this.board.boardArray[i + 3][j + 3] +
                            this.board.boardArray[i + 4][j + 4] === 4) {
                            count4++;
                            for (let n = 0; n < 5; n++) {
                                if (this.board.boardArray[i + n][j + n] === 1) {
                                    count4 += this.four(i + n, j + n, 0, 'c');
                                    if (count4 > 1) {
                                        return 2;
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
                //判断"/"向四四
                if (column + row < 15) {
                    for (i = row + column, j = 0; i >= 4; i--, j++) {
                        if (this.board.boardArray[i][j] + this.board.boardArray[i - 1][j + 1] +
                            this.board.boardArray[i - 2][j + 2] + this.board.boardArray[i - 3][j + 3] +
                            this.board.boardArray[i - 4][j + 4] === 4) {
                            count4++;
                            for (let o = 0; o < 5; o++) {
                                if (this.board.boardArray[i - o][j + o] === 1) {
                                    count4 += this.four(i - o, j + o, 0, 'd');
                                    if (count4 > 1) {
                                        return 2;
                                    }
                                }
                            }
                            break;
                        }
                    }
                } else {
                    for (i = 14, j = row + column - 14; j < 11; i--, j++) {
                        if (this.board.boardArray[i][j] + this.board.boardArray[i - 1][j + 1] +
                            this.board.boardArray[i - 2][j + 2] + this.board.boardArray[i - 3][j + 3] +
                            this.board.boardArray[i - 4][j + 4] === 4) {
                            count4++;
                            for (let p = 0; p < 5; p++) {
                                if (this.board.boardArray[i - p][j + p] === 1) {
                                    count4 += this.four(i - p, j + p, 0, 'd');
                                    if (count4 > 1) {
                                        return 2;
                                    }
                                }
                            }
                            break;
                        }
                    }
                }

                if (count4 > 1) {
                    return 2;
                }
            } else {
                if (direction !== 'a') {
                    // 横向四
                    for (j = 0; j < 11; j++) {
                        if (this.board.boardArray[row][j] +
                            this.board.boardArray[row][j + 1] +
                            this.board.boardArray[row][j + 2] +
                            this.board.boardArray[row][j + 3] +
                            this.board.boardArray[row][j + 4] === 4) {
                            return 1;
                        }
                    }
                }
                if (direction !== 'b') {
                    // 纵向四
                    for (i = 0; i < 11; i++) {
                        if (this.board.boardArray[i][column] +
                            this.board.boardArray[i + 1][column] +
                            this.board.boardArray[i + 2][column] +
                            this.board.boardArray[i + 3][column] +
                            this.board.boardArray[i + 4][column] === 4) {
                            return 1;
                        }
                    }
                }
                if (direction !== 'c') {
                    if (column > row) {
                        // 判断“\”向四
                        for (i = 0, j = column - row; i < (11 - column + row); i++, j++) {
                            if (this.board.boardArray[i][j] +
                                this.board.boardArray[i + 1][j + 1] +
                                this.board.boardArray[i + 2][j + 2] +
                                this.board.boardArray[i + 3][j + 3] +
                                this.board.boardArray[i + 4][j + 4] === 4) {
                                return 1;
                            }
                        }
                    } else {
                        // 判断“\”向“活三”
                        for (i = row - column, j = 0; i < 11; i++, j++) {
                            if (this.board.boardArray[i][j] +
                                this.board.boardArray[i + 1][j + 1] +
                                this.board.boardArray[i + 2][j + 2] +
                                this.board.boardArray[i + 3][j + 3] +
                                this.board.boardArray[i + 4][j + 4] === 4) {
                                return 1;
                            }
                        }
                    }
                }
                if (direction !== 'd') {
                    if (row + column < 15) {
                        // 判断“/”向
                        for (i = row + column, j = 0; i >= 4; i--, j++) {
                            if (this.board.boardArray[i][j] +
                                this.board.boardArray[i - 1][j + 1] +
                                this.board.boardArray[i - 2][j + 2] +
                                this.board.boardArray[i - 3][j + 3] +
                                this.board.boardArray[i - 4][j + 4] === 4) {
                                return 1;
                            }
                        }
                    } else {
                        // 判断“/”向
                        for (i = 14, j = row + column - 14; j < 11; i--, j++) {
                            if (this.board.boardArray[i][j] +
                                this.board.boardArray[i - 1][j + 1] +
                                this.board.boardArray[i - 2][j + 2] +
                                this.board.boardArray[i - 3][j + 3] +
                                this.board.boardArray[i - 4][j + 4] === 4) {
                                return 1;
                            }
                        }
                    }
                }
            }
            // 横向特殊四四禁手
            if (column > 2 && column < 12 &&
                this.board.boardArray[row][column - 3] === 1 &&
                this.board.boardArray[row][column - 2] === 0 &&
                this.board.boardArray[row][column - 1] === 1 &&
                this.board.boardArray[row][column + 3] === 1 &&
                this.board.boardArray[row][column + 2] === 0 &&
                this.board.boardArray[row][column + 1] === 1) {
                return 2;
            } else if (column > 2 && column < 11 &&
                this.board.boardArray[row][column - 3] === 1 &&
                this.board.boardArray[row][column - 2] === 1 &&
                this.board.boardArray[row][column - 1] === 0 &&
                this.board.boardArray[row][column + 4] === 1 &&
                this.board.boardArray[row][column + 3] === 1 &&
                this.board.boardArray[row][column + 2] === 0 &&
                this.board.boardArray[row][column + 1] === 1) {
                return 2;
            } else if (column > 3 && column < 11 &&
                this.board.boardArray[row][column - 4] === 1 &&
                this.board.boardArray[row][column - 3] === 1 &&
                this.board.boardArray[row][column - 2] === 1 &&
                this.board.boardArray[row][column - 1] === 0 &&
                this.board.boardArray[row][column + 4] === 1 &&
                this.board.boardArray[row][column + 3] === 1 &&
                this.board.boardArray[row][column + 2] === 1 &&
                this.board.boardArray[row][column + 1] === 0) {
                return 2;
            } else if (column > 3 && column < 11 &&
                this.board.boardArray[row][column - 4] === 1 &&
                this.board.boardArray[row][column - 3] === 1 &&
                this.board.boardArray[row][column - 2] === 0 &&
                this.board.boardArray[row][column - 1] === 1 &&
                this.board.boardArray[row][column + 4] === 1 &&
                this.board.boardArray[row][column + 3] === 1 &&
                this.board.boardArray[row][column + 2] === 0 &&
                this.board.boardArray[row][column + 1] === 1) {
                return 2;
            }
            // 纵向特殊四四
            if (row > 2 && row < 12 &&
                this.board.boardArray[row - 3][column] === 1 &&
                this.board.boardArray[row - 2][column] === 0 &&
                this.board.boardArray[row - 1][column] === 1 &&
                this.board.boardArray[row + 3][column] === 1 &&
                this.board.boardArray[row + 2][column] === 0 &&
                this.board.boardArray[row + 1][column] === 1) {
                return 2;
            } else if (row > 2 && row < 11 &&
                this.board.boardArray[row - 3][column] === 1 &&
                this.board.boardArray[row - 2][column] === 1 &&
                this.board.boardArray[row - 1][column] === 0 &&
                this.board.boardArray[row + 4][column] === 1 &&
                this.board.boardArray[row + 3][column] === 1 &&
                this.board.boardArray[row + 2][column] === 0 &&
                this.board.boardArray[row + 1][column] === 1) {
                return 2;
            } else if (row > 3 && row < 11 &&
                this.board.boardArray[row - 4][column] === 1 &&
                this.board.boardArray[row - 3][column] === 1 &&
                this.board.boardArray[row - 2][column] === 1 &&
                this.board.boardArray[row - 1][column] === 0 &&
                this.board.boardArray[row + 4][column] === 1 &&
                this.board.boardArray[row + 3][column] === 1 &&
                this.board.boardArray[row + 2][column] === 1 &&
                this.board.boardArray[row + 1][column] === 0) {
                return 2;
            } else if (row > 3 && row < 11 &&
                this.board.boardArray[row - 4][column] === 1 &&
                this.board.boardArray[row - 3][column] === 1 &&
                this.board.boardArray[row - 2][column] === 0 &&
                this.board.boardArray[row - 1][column] === 1 &&
                this.board.boardArray[row + 4][column] === 1 &&
                this.board.boardArray[row + 3][column] === 1 &&
                this.board.boardArray[row + 2][column] === 0 &&
                this.board.boardArray[row + 1][column] === 1) {
                return 2;
            }
            // 特殊"\"向四四
            if (row > 2 && row < 12 && column > 2 && column < 12 &&
                this.board.boardArray[row - 3][column - 3] === 1 &&
                this.board.boardArray[row - 2][column - 2] === 0 &&
                this.board.boardArray[row - 1][column - 1] === 1 &&
                this.board.boardArray[row + 1][column + 1] === 1 &&
                this.board.boardArray[row + 2][column + 2] === 0 &&
                this.board.boardArray[row + 3][column + 3] === 1) {
                return 2;
            } else if (row > 2 && row < 11 && column > 2 && column < 11 &&
                this.board.boardArray[row - 3][column - 3] === 1 &&
                this.board.boardArray[row - 2][column - 2] === 1 &&
                this.board.boardArray[row - 1][column - 1] === 0 &&
                this.board.boardArray[row + 4][column + 4] === 1 &&
                this.board.boardArray[row + 3][column + 3] === 1 &&
                this.board.boardArray[row + 2][column + 2] === 0 &&
                this.board.boardArray[row + 1][column + 1] === 1) {
                return 2;
            } else if (row > 3 && row < 11 && column > 3 && column < 11 &&
                this.board.boardArray[row - 4][column - 4] === 1 &&
                this.board.boardArray[row - 3][column - 3] === 1 &&
                this.board.boardArray[row - 2][column - 2] === 1 &&
                this.board.boardArray[row - 1][column - 1] === 0 &&
                this.board.boardArray[row + 4][column + 4] === 1 &&
                this.board.boardArray[row + 3][column + 3] === 1 &&
                this.board.boardArray[row + 2][column + 2] === 1 &&
                this.board.boardArray[row + 1][column + 1] === 0) {
                return 2;
            } else if (row > 3 && row < 11 && column > 3 && column < 11 &&
                this.board.boardArray[row - 4][column - 4] === 1 &&
                this.board.boardArray[row - 3][column - 3] === 1 &&
                this.board.boardArray[row - 2][column - 2] === 0 &&
                this.board.boardArray[row - 1][column - 1] === 1 &&
                this.board.boardArray[row + 4][column + 4] === 1 &&
                this.board.boardArray[row + 3][column + 3] === 1 &&
                this.board.boardArray[row + 2][column + 2] === 0 &&
                this.board.boardArray[row + 1][column + 1] === 1) {
                return 2;
            }
            // "/"向特殊四四
            if (row > 2 && row < 12 && column > 2 && column < 12 &&
                this.board.boardArray[row - 3][column + 3] === 1 &&
                this.board.boardArray[row - 2][column + 2] === 0 &&
                this.board.boardArray[row - 1][column + 1] === 1 &&
                this.board.boardArray[row + 3][column - 3] === 1 &&
                this.board.boardArray[row + 2][column - 2] === 0 &&
                this.board.boardArray[row + 1][column - 1] === 1) {
                return 2;
            } else if (row > 3 && row < 11 && column > 3 && column < 12 &&
                this.board.boardArray[row - 3][column + 3] === 1 &&
                this.board.boardArray[row - 2][column + 2] === 1 &&
                this.board.boardArray[row - 1][column + 1] === 0 &&
                this.board.boardArray[row + 4][column - 4] === 1 &&
                this.board.boardArray[row + 3][column - 3] === 1 &&
                this.board.boardArray[row + 2][column - 2] === 0 &&
                this.board.boardArray[row + 1][column - 1] === 1) {
                return 2;
            } else if (row > 3 && row < 11 && column > 3 && column < 11 &&
                this.board.boardArray[row - 4][column + 4] === 1 &&
                this.board.boardArray[row - 3][column + 3] === 1 &&
                this.board.boardArray[row - 2][column + 2] === 1 &&
                this.board.boardArray[row - 1][column + 1] === 0 &&
                this.board.boardArray[row + 4][column - 4] === 1 &&
                this.board.boardArray[row + 3][column - 3] === 1 &&
                this.board.boardArray[row + 2][column - 2] === 1 &&
                this.board.boardArray[row + 1][column - 1] === 0) {
                return 2;
            } else if (row > 3 && row < 11 && column > 3 && column < 11 &&
                this.board.boardArray[row - 4][column + 4] === 1 &&
                this.board.boardArray[row - 3][column + 3] === 1 &&
                this.board.boardArray[row - 2][column + 2] === 0 &&
                this.board.boardArray[row - 1][column + 1] === 1 &&
                this.board.boardArray[row + 4][column - 4] === 1 &&
                this.board.boardArray[row + 3][column - 3] === 1 &&
                this.board.boardArray[row + 2][column - 2] === 0 &&
                this.board.boardArray[row + 1][column - 1] === 1) {
                return 2;
            }
        }
        return 0;
    }

    /**
     * 鼠标跟随
     * @param event
     */
    mouseOnHover(event) {
        if (this.getStandardPos(event) === -99) {
            return;
        }
        let mouseRow = this.getStandardPos(event).standardX;
        let mouseColumn = this.getStandardPos(event).standardY;
        if (mouseRow >= 0 || mouseColumn >= 0 ||
            mouseRow <= 14 || mouseColumn <= 14) {
            this.clearCanvas();
            this.redrawBoard();
            this.redrawGoBang();
            if (this.result != null) {
                this.drawCrossAfterGetResult();
            }
            this.drawAim(mouseRow, mouseColumn);
        }
    }

    /**
     * 鼠标瞄准
     * @param x
     * @param y
     */
    drawAim(x, y) {
        let canvas = this.board.canvas;
        let ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        // 左上角横线
        ctx.moveTo(x - this.board.xGapSize / 3, y - this.board.yGapSize / 3);
        ctx.lineTo(x - this.board.xGapSize / 8, y - this.board.yGapSize / 3);
        // 左上角竖线
        ctx.moveTo(x - this.board.xGapSize / 3, y - this.board.yGapSize / 3);
        ctx.lineTo(x - this.board.xGapSize / 3, y - this.board.yGapSize / 8);

        // 左下角横线
        ctx.moveTo(x - this.board.xGapSize / 3, y + this.board.yGapSize / 3);
        ctx.lineTo(x - this.board.xGapSize / 8, y + this.board.yGapSize / 3);
        // 左下角竖线
        ctx.moveTo(x - this.board.xGapSize / 3, y + this.board.yGapSize / 8);
        ctx.lineTo(x - this.board.xGapSize / 3, y + this.board.xGapSize / 3);

        // 右上角横线
        ctx.moveTo(x + this.board.xGapSize / 8, y - this.board.yGapSize / 3);
        ctx.lineTo(x + this.board.xGapSize / 3, y - this.board.yGapSize / 3);
        // 右上角竖线
        ctx.moveTo(x + this.board.xGapSize / 3, y - this.board.yGapSize / 8);
        ctx.lineTo(x + this.board.xGapSize / 3, y - this.board.yGapSize / 3);

        // 右下角横线
        ctx.moveTo(x + this.board.xGapSize / 8, y + this.board.yGapSize / 3);
        ctx.lineTo(x + this.board.xGapSize / 3, y + this.board.yGapSize / 3);
        // 右下角竖线
        ctx.moveTo(x + this.board.xGapSize / 3, y + this.board.yGapSize / 8);
        ctx.lineTo(x + this.board.xGapSize / 3, y + this.board.yGapSize / 3);
        ctx.stroke();
    }

    /**
     * 重绘
     */
    redraw() {
        this.redrawBoard();
        this.redrawGoBang();
        if (this.result != null) {
            this.drawCrossAfterGetResult();
        }
    }

    /**
     * 重绘画板
     */
    redrawBoard() {
        this.clearCanvas();
        this.initAfterClearCanvas();
        this.board.UpdateBoard();
    }

    /**
     * 重绘棋子
     */
    redrawGoBang() {
        let isBlack;
        let row;
        let column;
        let standardX;
        let standardY;
        let goBang = this.goBangJsonArray;
        for (let i = 0; i < goBang.length; i++) {
            isBlack = goBang[i].who === "black";
            row = goBang[i].row;
            column = goBang[i].column;
            standardY = row * this.board.yGapSize + this.board.narrowFrameWidth;
            standardX = column * this.board.xGapSize + this.board.narrowFrameWidth;
            this.drawGoBang(isBlack, standardX, standardY);
        }
    }

    /**
     * 再来一局
     */
    restart() {
        this.clearCanvas();
        this.initAfterClearCanvas();
        this.board.UpdateBoard();
        this.board.isBlack = this.board.StandarIsBlack;
        this.board.boardArray = this.board.StandardBoardArray;
        this.gameOver = false;
        this.goBangJsonArray = [];
        this.goBangJson = {};
        this.isForbiddenRule = false;
        this.pieceNumber = 1;
        this.isAllowClick = false;
        this.result = null;
    }

    /**
     * 清除画板
     */
    clearCanvas() {
        let content = this.board.canvas;
        let ctx = content.getContext("2d");
        ctx.clearRect(0, 0, this.board.canvasWidth, this.board.canvasHeight);
    }

    /**
     * 清除画板后初始值修改
     */
    initAfterClearCanvas() {
        this.board.initStandardValue();
        this.board.xAxisPos = this.board.StandardXAxisPos;
        this.board.yAxisPos = this.board.StandardYAxisPos;
        this.board.xCoordinateindex = this.board.StandardXCoordinateIndex;
        this.board.yCoordinateindex = this.board.StandardYCoordinateIndex;
    }
}

/**
 * 五子棋插件——棋盘生成模块
 */
class initGobang {
    /**
     * 初始化五子棋插件
     * @param option
     */
    constructor(option) {
        let canvas = option.canvasDOM;

        this.canvas = canvas;

        // 生成一个canvas对象，初始化参数
        this.board = canvas.getContext("2d");

        // 初始化标准参数
        this.initStandardValue();

        // 设置参数
        this.setOption(option);

        // 画出新的棋盘
        this.UpdateBoard();
    }

    /**
     * 初始化标准值
     */
    initStandardValue() {
        /** 分辨率系数 **/
        this.StandardPersetZoom = 1;
        /** 棋盘左边框、上边框窄框宽度 **/
        this.StandardNarrowFrameWidth = 30;
        /** 棋盘右边框、下边框宽框宽度 **/
        this.StandardWideFrameWidth = 30;
        /** 棋盘标准线段数目 **/
        this.StandardNumber = 15;
        /** canvas标准宽度 **/
        this.StandardCanvasWidth = this.board.canvas.offsetWidth * this.StandardPersetZoom;
        /** canvas标准高度 **/
        this.StandardCanvasHeight = this.board.canvas.offsetHeight * this.StandardPersetZoom;
        /** 棋盘标准宽度 **/
        this.StandardBoardWidth = this.StandardCanvasWidth - this.StandardNarrowFrameWidth - this.StandardWideFrameWidth;
        /** 棋盘标准高度 **/
        this.StandarBoardHeight = this.StandardCanvasHeight - this.StandardNarrowFrameWidth - this.StandardWideFrameWidth;
        /** X方向线条间隔 **/
        this.StandardXGapSize = this.StandardBoardWidth / (this.StandardNumber - 1);
        /** Y方向线条间隔 **/
        this.StandardYGapSize = this.StandarBoardHeight / (this.StandardNumber - 1);
        /** 本轮棋子颜色，默认黑方先手 **/
        this.StandarIsBlack = true;
        /** 定义一个二维数组存放当前棋盘填充情况**/
        this.StandardBoardArray = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];
        /** 是否显示坐标 **/
        this.StandardCoordinate = false;
        /** X轴标准原点 **/
        this.StandardXAxisPos = 0;
        /** Y轴标准原点 **/
        this.StandardYAxisPos = 0;
        /** X轴标准初始坐标下标(a开始) **/
        this.StandardXCoordinateIndex = 97;
        /** Y轴标准初始坐标下标 **/
        this.StandardYCoordinateIndex = 15;
        /** 是否允许点击 **/
        // this.StandardIsAllowClick = false;
        this.StandardTestXCoordinateIndex = 0;
        this.StandardTestYCoordinateIndex = 0;
    }

    /**
     * 设置参数
     * @param option
     */
    setOption(option) {
        if (option.board == null) {
            option = {};
        }
        this.presetZoom = this.StandardPersetZoom;
        if (option.board.presetZoom != null) {
            this.presetZoom = option.board.presetZoom;
        }
        this.narrowFrameWidth = this.StandardNarrowFrameWidth;
        if (option.board.narrowFrameWidth != null) {
            this.narrowFrameWidth = option.board.narrowFrameWidth;
        }
        this.wideFrameWidth = this.StandardWideFrameWidth;
        if (option.board.wideFrameWidth != null) {
            this.wideFrameWidth = option.board.wideFrameWidth;
        }
        this.lineNumber = this.StandardNumber;
        if (option.board.lineNumber != null) {
            this.lineNumber = option.board.lineNumber;
        }
        this.canvasWidth = this.StandardCanvasWidth;
        if (option.board.canvasWidth != null) {
            this.canvasWidth = option.board.canvasWidth;
        }
        this.canvasHeight = this.StandardCanvasHeight;
        if (option.board.canvasHeight != null) {
            this.canvasHeight = option.board.canvasHeight;
        }
        this.boardWidth = this.StandardBoardWidth;
        if (option.board.boardWidth != null) {
            this.boardWidth = option.board.boardWidth;
        }
        this.boardHeight = this.StandarBoardHeight;
        if (option.board.boardHeight != null) {
            this.boardHeight = option.board.boardHeight;
        }
        this.xGapSize = this.StandardXGapSize;
        if (option.board.xGapSize != null) {
            this.xGapSize = option.board.xGapSize;
        }
        this.yGapSize = this.StandardYGapSize;
        if (option.board.yGapSize != null) {
            this.yGapSize = option.board.yGapSize;
        }
        this.isBlack = this.StandarIsBlack;
        if (option.board.isBlack != null) {
            this.isBlack = option.board.isBlack;
        }
        this.boardArray = this.StandardBoardArray;
        if (option.board.boardArray != null) {
            this.boardArray = option.board.boardArray;
        }
        /** 是否显示坐标 **/
        this.coordinate = this.StandardCoordinate;
        if (option.board.coordinate != null/* && option.board.coordinate === true*/) {
            this.coordinate = true;
        }
        this.xAxisPos = this.StandardXAxisPos;
        if (option.board.xAxisPos != null) {
            this.xAxisPos = option.board.xAxisPos;
        }
        this.yAxisPos = this.StandardYAxisPos;
        if (option.board.yAxisPos != null) {
            this.yAxisPos = option.board.yAxisPos;
        }
        this.xCoordinateindex = this.StandardXCoordinateIndex;
        if (option.board.xCoordinateindex != null) {
            this.xCoordinateindex = option.board.xCoordinateindex;
        }
        this.yCoordinateIndex = this.StandardYCoordinateIndex;
        if (option.board.yCoordinateIndex != null) {
            this.yCoordinateIndex = option.board.yCoordinateIndex;
        }
        // this.isAllowClick = this.StandardIsAllowClick;
        // if (option.board.isAllowClick != null) {
        //     this.isAllowClick = option.board.isAllowClick;
        // }
    }

    /**
     * 棋盘更新
     * @constructor
     */
    UpdateBoard() {
        let myBoard = this.board;
        // 画出棋盘线条
        this.drawLine(myBoard);
        if (this.coordinate === true) {
            // 画坐标系
            this.drawAxis(myBoard);
        }
        // 画内部圆点
        this.drawCirclePoint(myBoard);
    }

    /**
     * 画内部线条
     * @param myBoard
     */
    drawLine(myBoard) {
        myBoard.beginPath();
        myBoard.strokeStyle = "#cac5c5";
        myBoard.lineWidth = 1;
        for (let i = 1; i <= 15; i++) {
            /* 画横线 **/
            myBoard.moveTo(this.narrowFrameWidth, this.yGapSize * (i - 1) + this.narrowFrameWidth);
            myBoard.lineTo(this.canvasWidth - this.wideFrameWidth, this.yGapSize * (i - 1) + this.narrowFrameWidth);
            /** 画竖线 **/
            myBoard.moveTo(this.xGapSize * (i - 1) + this.narrowFrameWidth, this.narrowFrameWidth);
            myBoard.lineTo(this.xGapSize * (i - 1) + this.narrowFrameWidth, this.canvasHeight - this.wideFrameWidth);

        }
        myBoard.stroke();
    }

    /**
     * 画坐标
     * @param myBoard
     */
    drawAxis(myBoard) {
        let XCharacter;
        let XCharacterWidth;
        let YCharacterWidth;
        let YCharacterHeight;
        this.xAxisPos = 0;
        this.xCoordinateindex = 97;
        myBoard.fillStyle = 'black';
        /**
         * X轴
         */
        while (String.fromCharCode(this.xCoordinateindex) <= 'o') {
            // 将数字转化为ASCII吗
            XCharacter = String.fromCharCode(this.xCoordinateindex);
            // 求字符的宽度
            XCharacterWidth = this.board.measureText(XCharacter).width;
            myBoard.font = '11pt Arial';
            myBoard.fillText(XCharacter, this.xAxisPos + this.narrowFrameWidth - XCharacterWidth / 2, this.canvasHeight - 5);
            this.xCoordinateindex += 1;
            this.xAxisPos += this.xGapSize;
        }
        this.xAxisPos = 0;
        this.yAxisPos = 0;
        this.yCoordinateIndex = 15;
        /**
         * Y轴
         */
        while (this.yCoordinateIndex >= 1) {
            // 求字符的宽度
            YCharacterWidth = this.board.measureText(this.yCoordinateIndex).width;
            YCharacterHeight = this.board.font.split("px", 1)[0];
            // 字符的x轴位置
            this.xAxisPos = this.canvasWidth - this.wideFrameWidth / 2 - YCharacterWidth / 2;
            let y = this.wideFrameWidth + this.yAxisPos/*  - YCharacterHeight / 2 */;
            myBoard.font = '11pt Arial';
            myBoard.fillText(this.yCoordinateIndex, this.xAxisPos, this.wideFrameWidth + this.yAxisPos /* - YCharacterHeight / 2 */);
            this.yCoordinateIndex -= 1;
            this.yAxisPos += this.yGapSize;
        }
        // this.xAxisPos = 0;
        // this.StandardTestXCoordinateIndex = 0;
        // /**
        //  * 测试X轴
        //  */
        // while (this.StandardTestXCoordinateIndex < 15) {
        //     // 将数字转化为ASCII吗
        //     XCharacter = String.fromCharCode(this.StandardTestXCoordinateIndex);
        //     // 求字符的宽度
        //     XCharacterWidth = this.board.measureText(XCharacter).width;
        //     myBoard.font = '11pt Arial';
        //     myBoard.fillText(this.StandardTestXCoordinateIndex, this.xAxisPos + this.narrowFrameWidth - XCharacterWidth / 2, this.narrowFrameWidth / 2);
        //     this.StandardTestXCoordinateIndex += 1;
        //     this.xAxisPos += this.xGapSize;
        // }
        // this.xAxisPos = 0;
        // this.yAxisPos = 0;
        // this.StandardTestYCoordinateIndex = 0;
        // /**
        //  * 测试Y轴
        //  */
        // while (this.StandardTestYCoordinateIndex < 15) {
        //     // 求字符的宽度
        //     YCharacterWidth = this.board.measureText(this.StandardTestYCoordinateIndex).width;
        //     YCharacterHeight = this.board.font.split("px", 1)[0];
        //     // 字符的x轴位置
        //     this.xAxisPos = this.wideFrameWidth / 2 - YCharacterWidth / 2;
        //     myBoard.font = '11pt Arial';
        //     myBoard.fillText(this.StandardTestYCoordinateIndex, this.xAxisPos, this.wideFrameWidth + this.yAxisPos /* - YCharacterHeight / 2 */);
        //     this.StandardTestYCoordinateIndex += 1;
        //     this.yAxisPos += this.yGapSize;
        // }
    }

    /**
     * 画内部小圆点
     * @param myBoard
     */
    drawCirclePoint(myBoard) {

        /** 画一个圆点 */
        let drawOneCirclePoint = function (x, y) {
            myBoard.beginPath();
            myBoard.arc(this.narrowFrameWidth + x * this.xGapSize, this.narrowFrameWidth + y * this.yGapSize, 2.5, Math.PI * 2, 0, false);
            myBoard.fillStyle = "#b1afaf";
            myBoard.fill();
            myBoard.closePath();
        }.bind(this);

        /** 画内部左上方小圆点 **/
        drawOneCirclePoint(3, 3);
        /** 画内部右上方小圆点 **/
        drawOneCirclePoint(11, 3);
        /** 画内部中间小圆点 **/
        drawOneCirclePoint(7, 7);
        /** 画内部左下方小圆点 **/
        drawOneCirclePoint(3, 11);
        /** 画内部右下方小圆点 **/
        drawOneCirclePoint(11, 11);

    }
}
