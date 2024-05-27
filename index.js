/* global Vue */

(() => {
  /*   const notification = (config) =>
      UIkit.notification({
        pos: "top-right",
        timeout: 5000,
        ...config,
      });
   */
  /* const alert = (message) =>
    notification({
      message,
      status: "danger",
    });

  const info = (message) =>
    notification({
      message,
      status: "success",
    });

  const fetchJson = (...args) =>
    fetch(...args)
      .then((res) =>
        res.ok
          ? res.status !== 204
            ? res.json()
            : null
          : res.text().then((text) => {
              throw new Error(text);
            })
      )
      .catch((err) => {
        alert(err.message);
      }); */

  new Vue({
    el: "#app",
    data: {
      desc: "",
      activeTimers: [],
      oldTimers: [],
      client: new WebSocket(`ws://localhost:${process.env.PORT}`)
    },
    methods: {
      createTimer() {
        const description = this.desc;
        this.desc = "";

        this.client.send(JSON.stringify({
          type: "create",
          body: description,
        }))
      },
      stopTimer(id) {
        this.desc = "";

        this.client.send(JSON.stringify({
          type: "stop",
          body: id,
        }))
      },
      formatTime(ts) {
        return new Date(ts).toTimeString().split(" ")[0];
      },
      formatDuration(d) {
        d = Math.floor(d / 1000);
        const s = d % 60;
        d = Math.floor(d / 60);
        const m = d % 60;
        const h = Math.floor(d / 60);
        return [h > 0 ? h : null, m, s]
          .filter((x) => x !== null)
          .map((x) => (x < 10 ? "0" : "") + x)
          .join(":");
      },
    },
    created() {
      this.client.addEventListener("message", (message) => {
        const data = JSON.parse(message.data);

        if (data.type === "all_timers") {
          this.activeTimers = [];
          this.oldTimers = [];

          data.data.forEach(element => {
            if (element.isActive === true) {
              this.activeTimers.push(element);
            } else {
              this.oldTimers.push(element);
            }
          });
        }
        if (data.type === "active_timers") {
          this.activeTimers = [];
          data.data.forEach(element => {
            this.activeTimers.push(element);
          });
        }
      })
    },
  });
})();
