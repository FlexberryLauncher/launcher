const { createApp } = Vue;

createApp({
  data() {
    return {
      activeTab: "",
      toggledSubmenu: "versionSettings",
      toggledModal: "",

      profiles: [],
      accounts: [],
      versions: [],
      versionsFilter: [],

      meta: {
        launcher: {},
        system: {}
      },

      // I don't recommend you to edit this if you have no idea about know what you are doing
      eventsToInvoke: [{ data: "versions", association: "versionManager", name: "getVersions", loaded: false }, { data: "profiles", association: "versionManager", name: "getProfiles", loaded: false }, { data: "accounts", bindIntoState: true, association: "accountManager", name: "getAccounts", loaded: false }],

      loadingStates: {
        accounts: true,
        launcher: false
      },
      progress: {
        state: undefined
      },
      blocks: ["glass", "grass_block", "diamond_block", "bedrock", "cobblestone", "crying_obsidian", "netherrack", "oak_log", "spruce_planks", "copper_block", "redstone_ore", "andesite"],
      wizard: {
        page: 0,
        alert: undefined,
        data: {}
      }
    }
  },
  computed: {
    filteredVersions: {
      get() {
        return this.versions.filter(version => this.versionsFilter.some(filter => version.type.includes(filter)));
      }
    }
  },
  methods: {
    load() {
      this.loadingStates.launcher = false;
      IPC.send("loaded");
      document.querySelector("link[href='style/loading.css']")?.remove();
    },
    toggleTab(tab) {
      this.activeTab = this.activeTab == tab ? "" : tab;
      this.toggledSubmenu = "versionSettings";
    },
    toggleSubTab(tab) {
      this.toggledSubmenu = tab;
    },
    toggleModal(modal) {
      if (((modal == "") && (this.toggledModal == "versionSelector")) || (modal == "versionSelector"))
        this.resetWizard();
      this.toggledModal = modal;
    },
    deleteProfile(profile) {
      this.profiles = this.profiles.filter(pf => pf.appearance?.name != profile);
      IPC.send("deleteProfile", profile);
      // If there is no selected profile, select the first one
      if (!this.profiles.find(profile => profile.isSelected)) {
        this.selectProfile(this.profiles[0].appearance.name);
        this.profiles[0].isSelected = true;
      }
    },
    selectProfile(profile) {
      const profileToSelect = this.profiles.find(pf => pf.appearance?.name == profile);
      if (!profileToSelect)
        return;
      profileToSelect.selected = true;
      IPC.send("selectProfile", profile);
    },
    login() {
      this.loadingStates.accounts = true;
      IPC.send("addAccount");
    },
    selectAccount(uuid) {
      this.loadingStates.accounts = true;
      const accountValidity = JSON.parse(IPC.sendSync("verifyAccount", uuid));
      if (accountValidity.status == "error")
        return alert(accountValidity.error);
      if (accountValidity.valid)
        IPC.send("selectAccount", uuid);
      else 
        IPC.send("refreshAccount", uuid);
    },
    logout(uuid) {
      this.loadingStates.accounts = true;
      IPC.send("deleteAccount", uuid);
    },
    // Wizard methods
    selectBlock(block) {
      this.wizard.data.appearance.icon = block;
    },
    selectVersion(version) {
      this.wizard.data.version = version.id;
      this.wizard.data.type = version.type;
    },
    resetWizard() {
      this.wizard.data = {
        version: "",
        type: "",
        appearance: {
          icon: "glass",
          name: ""
        },
        memory: Math.min(Math.floor(this.meta.system.memory / 1024 / 1024 / 2.5), 8000),
        dimensions: {
          width: 500,
          height: 420
        }
      };
      this.wizard.alert = undefined;
      this.wizard.page = 0;
      document?.getElementById("wizard")?.scrollTo(0, 0);
    },
    nextWizardPage() {
      if ((this.wizard.page == 0) && this.wizard.data.appearance.name == "") {
        this.wizard.alert = "Please enter a profile name";
        setTimeout(() => {
          this.wizard.alert = undefined;
        }, 2000);
        return;
      }
      if (this.wizard.page == 1) {
        if (this.wizard.data.version == "") {
          this.wizard.alert = "Please select a version";
          setTimeout(() => {
            this.wizard.alert = undefined;
          }, 2000);
          return;
        } else {
          this.wizard.alert = "Create profile";
        }
      } else if (this.wizard.alert == "Create profile") {
        // Vue treats the data Objects as a Proxy
        const profile = JSON.parse(JSON.stringify(this.wizard.data));
        IPC.send("addProfile", profile);
        this.toggleModal("");
        return;
      }
      const wizard = document.getElementById("wizard");
      wizard.scrollBy({
        top: 0,
        left: wizard.offsetWidth + 17,
        behavior: "smooth"
      });
      this.wizard.page++;
    },
    check(value, data) {
      if (this[data].includes(value) && this[data].length > 1)
        this[data] = this[data].filter(v => v != value);
      else if (!this[data].includes(value))
        this[data].push(value);
      if (data == "versionsFilter") {
        if (!this.filteredVersions.map(version => version.id).includes(this.wizard.data.version))
          this.wizard.data.version = this.wizard.data.type = "";
      }
    },
    // Launch methods
    launch() {
      const selectedProfile = JSON.parse(JSON.stringify(this.profiles.find(profile => profile.isSelected)));
      const launchProfile = {
        ...JSON.parse(JSON.stringify(this.versions.find(version => version.id == selectedProfile.version))),
        profile: selectedProfile,
        account: JSON.parse(JSON.stringify(this.accounts.find(account => account.isSelected))) || ("flexberry" + Math.floor(Math.random() * 1000) + 100)
      }
      console.log(launchProfile);
      this.loadingStates.launcher = true;
      this.progress.state = "Preparing...";
      IPC.send("launch", launchProfile);
    }
  },
  watch: {
    "loadingStates.launcher"(value) {
      if (value)
        document.body.classList.add("loaded");
      else
        document.body.classList.remove("loaded");
    }
  },
  beforeMount() {
    // If you want faster load time, change beforeMount to created
    // But animations and images may be glitchy for a few milliseconds
    this.resetWizard();
  },
  mounted() {
    this.meta = IPC.sendSync("getMeta"); 
    this.check("release", "versionsFilter");

    let i = 0;
    IPC.on("pong", (meta) => {
      for (const event of meta.call) {
        IPC.invoke(event).then(result => {
          let eventToInvoke = this.eventsToInvoke.find(e => e.name == event);
          if (eventToInvoke.bindIntoState)
            this.loadingStates[eventToInvoke.data] = false;
          console.log(eventToInvoke);
          this[eventToInvoke.data] = result;
          eventToInvoke.loaded = true;
          if (this.eventsToInvoke.every(e => e.loaded) && !this.loadingStates.launcher)
            this.load();
          console.log(`Loaded ${event} from ${eventToInvoke.association} with ${result.length} data length`);
        }).catch(error => {
          // alert(`Error while loading ${event}: ${error}`);
          console.error(error.stack);
        });

      }
    });

    IPC.on("profiles", (profiles) => {
      if (profiles.status == "error") {
        profiles.message && alert(profiles.message);
        return console.error(profiles);
      }
      this.profiles = profiles;
    });

    IPC.on("accounts", (result) => {
      result = JSON.parse(result);
      this.loadingStates.accounts = false;
      if (result.status == "error")
        return console.error(result.error || "Unknown error");
      this.accounts = JSON.parse(result.accounts);
    });

    IPC.on("refreshAccountResult", (result) => {
      result = JSON.parse(result);
      this.loadingStates.accounts = true;
      if (result.status == "error")
        return console.error(result);
      IPC.send("selectAccount", result.uuid);
    });

    IPC.on("progress", (progress) => {
      if (progress.type == "update") {
        this.loadingStates.launcher = true;
        this.progress.state = progress.message;
      } else {
        if (progress.action == "ui") {
          !progress.state && location.reload();
          return this.loadingStates.launcher = progress.state;
        }
        this.progress.state = (progress instanceof Object)
          ? (((progress.type == "assets") && Math.round((progress.task / progress.total) * 100) == 0)) || (progress.type == "assets-copy")
            ? "Initializing assets"
            : (`Downloading ${progress.type} ${Math.round((progress.task / progress.total) * 100)}%`)
          : progress;
      }
    });

    IPC.send("ping");
  }
}).mount("#app");