Page({
    data: {
        loading: true,
        option1: [
            { text: "所有记录", value: "ab" },
            { text: "我的订单", value: "a" },
            { text: "我的参与", value: "b" },
        ],
        option2: [
            { text: "所有状态", value: "abcd" },
            { text: "现存", value: "ab" },
            { text: "历史", value: "cd" },
            { text: "待审核", value: "a" },
            { text: "已付款", value: "b" },
            { text: "已完成", value: "c" },
            { text: "已拒绝", value: "d" },
        ],
        value1: "ab",
        value2: "abcd",
    },
    onLoad: function(options) {
        var filter1 = "";
        var filter2 = "";

        if (options.order) {
            filter1 += "a";
        }
        if (options.participation) {
            filter1 += "b";
        }

        if (options.pending) {
            filter2 += "a";
        }
        if (options.paid) {
            filter2 += "b";
        }
        if (options.complete) {
            filter2 += "c";
        }
        if (options.rejected) {
            filter2 += "d";
        }

        this.getAllData(options.storeid, options.cordid, filter1, filter2, options.merchantCategory);

        this.setData({
            value1: filter1,
            value2: filter2,
            cordID: options.cordid,
            storeid: options.storeid,
            merchantCategory: options.merchantCategory,
            options: options,
        });
    },
    onReady: function() {
        this.setData({
            loading: false,
        });
    },
    onPullDownRefresh: function() {
        this.onLoad(this.data.options); //重新加载onLoad()
        wx.hideLoading();
    },

    categoryChanged(value) {
        this.changeFilter(
            value.detail,
            this.data.value2,
            this.data.allOrders,
            this.data.allReservationParticipations,
            this.data.allFoodParticipations
        );
        this.setData({
            value1: value.detail,
        });
    },
    statusChanged(value) {
        this.changeFilter(
            this.data.value1,
            value.detail,
            this.data.allOrders,
            this.data.allReservationParticipations,
            this.data.allFoodParticipations
        );
        this.setData({
            value2: value.detail,
        });
    },

    changeFilter(filter1, filter2, allOrders, reservationParticipations, foodParticipations) {
        // setting filter
        var ifOrder = false;
        var ifParticipation = false;
        var ifPending = false;
        var ifPaid = false;
        var ifComplete = false;
        var ifRejected = false;

        if (filter1.includes("a")) {
            ifOrder = true;
        }
        if (filter1.includes("b")) {
            ifParticipation = true;
        }
        if (filter2.includes("a")) {
            ifPending = true;
        }
        if (filter2.includes("b")) {
            ifPaid = "true";
        }
        if (filter2.includes("c")) {
            ifComplete = true;
        }
        if (filter2.includes("d")) {
            ifRejected = true;
        }

        //setting data
        var finalOrders = [];
        var finalReservationParticipations = [];
        var finalFoodParticipations = [];
        if (ifOrder) {
            if (ifPending) {
                allOrders.forEach((v) => {
                    if (v.status == "pending") {
                        finalOrders.push(v);
                    }
                });
            }
            if (ifPaid) {
                allOrders.forEach((v) => {
                    if (v.status == "paid") {
                        finalOrders.push(v);
                    }
                });
            }
            if (ifComplete) {
                allOrders.forEach((v) => {
                    if (v.status == "complete") {
                        finalOrders.push(v);
                    }
                });
            }
            if (ifRejected) {
                allOrders.forEach((v) => {
                    if (v.status == "rejected") {
                        finalOrders.push(v);
                    }
                });
            }
        }

        if (ifParticipation) {
            if (ifPending) {
                reservationParticipations.forEach((v) => {
                    if (v.status == "pending") {
                        finalReservationParticipations.push(v);
                    }
                });
                foodParticipations.forEach((v) => {
                    if (v.status == "pending") {
                        finalFoodParticipations.push(v);
                    }
                });
            }
            if (ifPaid) {
                reservationParticipations.forEach((v) => {
                    if (v.status == "paid") {
                        finalReservationParticipations.push(v);
                    }
                });
                foodParticipations.forEach((v) => {
                    if (v.status == "paid") {
                        finalFoodParticipations.push(v);
                    }
                });
            }
            if (ifComplete) {
                reservationParticipations.forEach((v) => {
                    if (v.status == "complete") {
                        finalReservationParticipations.push(v);
                    }
                });
                foodParticipations.forEach((v) => {
                    if (v.status == "complete") {
                        finalFoodParticipations.push(v);
                    }
                });
            }
            if (ifRejected) {
                reservationParticipations.forEach((v) => {
                    if (v.status == "rejected") {
                        finalReservationParticipations.push(v);
                    }
                });
                foodParticipations.forEach((v) => {
                    if (v.status == "rejected") {
                        finalFoodParticipations.push(v);
                    }
                });
            }
        }

        finalOrders.sort(function(a, b) {
            return a.date.getTime() - b.date.getTime()
        });
        finalReservationParticipations.sort(function(a, b) {
            return a.date.getTime() - b.date.getTime()
        });
        finalFoodParticipations.sort(function(a, b) {
            return a.createTime.getTime() - b.createTime.getTime()
        });
        this.setData({
            selectedOrders: finalOrders,
            selectedReservationParticipations: finalReservationParticipations,
            selectedFoodParticipations: finalFoodParticipations,
        });
    },

    async getAllData(storeID, cordID, filter1, filter2, category) {
        var ifOrder = false;
        var ifParticipation = false;
        var ifPending = false;
        var ifPaid = false;
        var ifComplete = false;
        var ifRejected = false;

        if (filter1.includes("a")) {
            ifOrder = true;
        }
        if (filter1.includes("b")) {
            ifParticipation = true;
        }
        if (filter2.includes("a")) {
            ifPending = true;
        }
        if (filter2.includes("b")) {
            ifPaid = true;
        }
        if (filter2.includes("c")) {
            ifComplete = true;
        }
        if (filter2.includes("d")) {
            ifRejected = true;
        }
        this.getUserOrders(
            storeID,
            ifOrder,
            ifPending,
            ifPaid,
            ifComplete,
            ifRejected,
            category
        );
        this.getUserParticipations(
            cordID,
            ifParticipation,
            ifPending,
            ifPaid,
            ifComplete,
            ifRejected
        );
    },

    async getUserOrders(
        storeID,
        ifOrder,
        ifPending,
        ifPaid,
        ifComplete,
        ifRejected,
        category
    ) {
        var allOrders = [];
        var selectedOrders = [];

        if (category == "chef") {
            const res = await wx.cloud
                .database()
                .collection("orders")
                .where({
                    merchant: storeID,
                })
                .orderBy("createTime", "asc")
                .get();
            res.data.forEach(async(v) => {
                const orderData = v.foodOrder;
                const participantData = await this.getUserData(v.participant);
                const merchantData = await this.getMerchantData(v.merchant);
                const transactionData = await this.getTransactionData(v.transaction);
                const createTime = this.formatTimeWithHours(new Date(v.createTime));
                v.orderData = orderData;
                v.createTime = createTime;
                v.transactionData = transactionData;
                v.participantData = participantData;
                v.merchantData = merchantData;

                if (ifOrder) {
                    if (ifPending) {
                        if (v.status == "pending") {
                            selectedOrders.push(v);
                        }
                    }
                    if (ifPaid) {
                        if (v.status == "paid") {
                            selectedOrders.push(v);
                        }
                    }
                    if (ifComplete) {
                        if (v.status == "complete") {
                            selectedOrders.push(v);
                        }
                    }
                    if (ifRejected) {
                        if (v.status == "rejected") {
                            selectedOrders.push(v);
                        }
                    }
                }
                allOrders.push(v);
                allOrders.sort(function(a, b) {
                    return a.createTime.getTime() - b.createTime.getTime()
                });
                selectedOrders.sort(function(a, b) {
                    return a.createTime.getTime() - b.createTime.getTime()
                });
                this.setData({
                    selectedOrders: selectedOrders,
                    allOrders: allOrders,
                });
            });
        } else {
            const res = await wx.cloud
                .database()
                .collection("orders")
                .where({
                    merchant: storeID,
                })
                .orderBy("date", "asc")
                .get();
            res.data.forEach(async(v) => {
                const serviceData = await this.getServiceData(v.service);
                const participantData = await this.getUserData(v.participant);
                const merchantData = await this.getMerchantData(v.merchant);
                const transactionData = await this.getTransactionData(v.transaction);
                const createTime = this.formatTimeWithHours(new Date(v.createTime));
                const reservationTime = new Date(v.date);
                v.serviceData = serviceData;
                v.reservationTime = this.formatTimeWithHours(reservationTime);
                v.createTime = createTime;
                v.transactionData = transactionData;
                v.participantData = participantData;
                v.merchantData = merchantData;

                if (ifOrder) {
                    if (reservationTime < new Date()) {
                        v.status = "complete";
                    }

                    if (ifPending) {
                        if (v.status == "pending") {
                            selectedOrders.push(v);
                        }
                    }
                    if (ifPaid) {
                        if (v.status == "paid") {
                            selectedOrders.push(v);
                        }
                    }
                    if (ifComplete) {
                        if (v.status == "complete") {
                            selectedOrders.push(v);
                        }
                    }
                    if (ifRejected) {
                        if (v.status == "rejected") {
                            selectedOrders.push(v);
                        }
                    }
                }
                allOrders.push(v);
                allOrders.sort(function(a, b) {
                    return a.date.getTime() - b.date.getTime()
                });
                selectedOrders.sort(function(a, b) {
                    return a.date.getTime() - b.date.getTime()
                });
                this.setData({
                    selectedOrders: selectedOrders,
                    allOrders: allOrders,
                });
            });
        }
    },

    async getUserParticipations(
        cordid,
        ifParticipation,
        ifPending,
        ifPaid,
        ifComplete,
        ifRejected
    ) {
        const reservationRes = await wx.cloud
            .database()
            .collection("orders")
            .where({
                participant: cordid,
                category: "reservation"
            })
            .orderBy("date", "asc")
            .get();

        const foodRes = await wx.cloud
            .database()
            .collection("orders")
            .where({
                participant: cordid,
                category: "food"
            })
            .orderBy("createTime", "asc")
            .get();

        var allReservationParticipations = [];
        var selectedReservationParticipations = [];
        var allFoodParticipations = [];
        var selectedFoodParticipations = [];
        reservationRes.data.forEach(async(v) => {
            const serviceData = await this.getServiceData(v.service);
            const participantData = await this.getUserData(v.participant);
            const merchantData = await this.getMerchantData(v.merchant);
            const transactionData = await this.getTransactionData(v.transaction);
            const reservationTime = new Date(v.date);
            v.serviceData = serviceData;
            v.reservationTime = this.formatTimeWithHours(reservationTime);
            v.participantData = participantData;
            v.merchantData = merchantData;
            v.transactionData = transactionData;

            if (ifParticipation) {
                if (reservationTime < new Date()) {
                    v.status = "complete";
                }

                if (ifPending) {
                    if (v.status == "pending") {
                        selectedReservationParticipations.push(v);
                    }
                }
                if (ifPaid) {
                    if (v.status == "paid") {
                        selectedReservationParticipations.push(v);
                    }
                }
                if (ifComplete) {
                    if (v.status == "complete") {
                        selectedReservationParticipations.push(v);
                    }
                }
                if (ifRejected) {
                    if (v.status == "rejected") {
                        selectedReservationParticipations.push(v);
                    }
                }
            }

            allReservationParticipations.push(v);
            allReservationParticipations.sort(function(a, b) {
                return new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime()
            });
            selectedReservationParticipations.sort(function(a, b) {
                return new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime()
            });

            this.setData({
                selectedReservationParticipations: selectedReservationParticipations,
                allReservationParticipations: allReservationParticipations,
            });
        });
        foodRes.data.forEach(async(v) => {
            const participantData = await this.getUserData(v.participant);
            const merchantData = await this.getMerchantData(v.merchant);
            const transactionData = await this.getTransactionData(v.transaction);
            v.participantData = participantData;
            v.merchantData = merchantData;
            v.transactionData = transactionData;

            if (ifParticipation) {
                if (ifPending) {
                    if (v.status == "pending") {
                        selectedFoodParticipations.push(v);
                    }
                }
                if (ifPaid) {
                    if (v.status == "paid") {
                        selectedFoodParticipations.push(v);
                    }
                }
                if (ifComplete) {
                    if (v.status == "complete") {
                        selectedFoodParticipations.push(v);
                    }
                }
                if (ifRejected) {
                    if (v.status == "rejected") {
                        selectedFoodParticipations.push(v);
                    }
                }
            }

            allFoodParticipations.push(v);
            allFoodParticipations.sort(function(a, b) {
                return new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
            });
            selectedFoodParticipations.sort(function(a, b) {
                return new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
            });

            this.setData({
                selectedFoodParticipations: selectedFoodParticipations,
                allFoodParticipations: allFoodParticipations,
            });
        });
    },

    getUserData(userID) {
        return new Promise((resolve, reject) => {
            wx.cloud
                .database()
                .collection("user")
                .where({
                    _id: userID,
                })
                .get()
                .then((res) => {
                    resolve(res.data[0]);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

    getServiceData(serviceID) {
        return new Promise((resolve, reject) => {
            wx.cloud
                .database()
                .collection("service")
                .doc(serviceID)
                .get()
                .then((res) => {
                    resolve(res.data);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },
    async getTransactionData(transactionID) {
        return new Promise((resolve, reject) => {
            wx.cloud
                .database()
                .collection("transaction")
                .doc(transactionID)
                .get()
                .then((res) => {
                    res.data.createTime = this.formatTimeWithHours(
                        new Date(res.data.createTime)
                    );
                    resolve(res.data);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

    getMerchantData(merchantID) {
        return new Promise((resolve, reject) => {
            wx.cloud
                .database()
                .collection("merchant")
                .doc(merchantID)
                .get()
                .then((res) => {
                    resolve(res.data);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

    orderNavigator(e) {
        wx.navigateTo({
            url: "/pages/orderDetail/index?orderid=" + e.currentTarget.dataset.orderid,
        });
    },
    foodOrderNavigator(e) {
      wx.navigateTo({
          url: "/pages/foodOrderDetail/index?orderid=" + e.currentTarget.dataset.orderid,
      });
    },
    formatTimeWithHours(date) {
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var hour = date.getHours();
        var minute = date.getMinutes();
        var second = date.getSeconds();

        return (
            [year, month, day].map(this.formatNumber).join("/") +
            " " + [hour, minute].map(this.formatNumber).join(":")
        );
    },
    formatNumber(n) {
        n = n.toString();
        return n[1] ? n : "0" + n;
    },
});