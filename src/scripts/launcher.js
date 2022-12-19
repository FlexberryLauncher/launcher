const { createApp, toRaw } = Vue;

// TO-DO: Migrate some of the CSS @keyframes to JS

createApp({
  data() {
    return {
      activeTab: "",

      profiles: [],
      profilesSearch: "",
      accounts: [],
      accountsSearch: "",
      versions: [],
      versionsFilter: [],

      skins: [],

      meta: {
        launcher: {},
        system: {},
      },
      
      tooltip: {
        visible: false,
        actions: [],
      },

      // I don't recommend you to edit this if you have no idea about what you are doing
      eventsToInvoke: [{ data: "versions", association: "versionManager", name: "getVersions", loaded: false }, { data: "profiles", association: "versionManager", name: "getProfiles", loaded: false }, { data: "accounts", bindIntoState: true, association: "accountManager", name: "getAccounts", loaded: false }],

      loadingStates: {
        accounts: true,
        launcher: false,
        addProfile: false,
      },
      progress: {
        state: undefined
      },
      blocks: ["glass", "grass_block", "diamond_block", "bedrock", "cobblestone", "crying_obsidian", "netherrack", "oak_log", "spruce_planks", "copper_block", "redstone_ore", "andesite"],
      wizard: {
        alert: undefined,
        mode: "data",
        data: {
          appearance: {}
        },
        edit: {
          appearance: {}
        }
      }
    }
  },
  computed: {
    filteredVersions: {
      get() {
        return this.versions.filter(version => this.versionsFilter.some(filter => version.type.includes(filter)));
      }
    },
    filteredProfiles: {
      get() {
        return this.profiles.filter(profile => profile.appearance.name.toLowerCase().includes(this.profilesSearch.toLowerCase()) || profile.version.toLowerCase().includes(this.profilesSearch.toLowerCase()));
      }
    },
    filteredAccounts: {
      get() {
        return this.accounts.filter(account => account.username.toLowerCase().includes(this.accountsSearch?.toLowerCase()));
      }
    },
    skin: {
      get() {
        const account = this.accounts.find(account => account.isSelected)?.profile;
        return (account && account.skins && account.skins.length && account.skins[0].url) || "http://assets.mojang.com/SkinTemplates/steve.png";
      }
    }
  },
  methods: {
    // General methods
    toggleTab(tab) {
      if (this.activeTab == tab) {
        this.activeTab = "";
      } else {
        this.activeTab = tab;
      }
      (tab == "addProfile") && this.resetWizard();
    },
    load() {
      this.loadingStates.launcher = false;
      IPC.send("loaded");
      document.querySelector("link[href='style/loading.css']")?.remove();
    },
    async showTooltip(event, options) {
      this.tooltip.actions = options;
      const tooltipRef = this.$refs.tooltip;
      await new Promise(resolve => setTimeout(resolve, 60)); // Wait for click event to be fired
      const tooltipBounds = tooltipRef.getBoundingClientRect();
      const buttonBounds = event.target.getBoundingClientRect();
      tooltipRef.style.top = buttonBounds.top - tooltipBounds.height - 10 + "px";
      tooltipRef.style.left = buttonBounds.left + buttonBounds.width / 2 - tooltipBounds.width / 2 + "px";
      this.tooltip.visible = true;
    },
    // Account and version profile methods
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
    openEditProfile(profile) {
      this.toggleTab("addProfile");
      this.wizard.edit = JSON.parse(JSON.stringify(profile));
      this.wizard.staticName = profile?.appearance?.name;
      this.wizard.mode = "edit";
    },
    resetWizard() {
      this.wizard.data = {
        version: "",
        type: "",
        directory: "",
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
      this.wizard.mode = "data";
      this.wizard.alert = undefined;
    },
    createProfile() {
      const profile = toRaw(this.wizard[this.wizard.mode]);
      if (!profile.appearance.name)
        return alert("Please enter a profile name");
      if (!profile.version)
        return alert("Please select a version");
      this.loadingStates.addProfile = true;
      if (this.wizard.mode == "edit")
        IPC.send("editProfile", profile);
      else
        IPC.send("addProfile", profile);
      this.wizard.mode = "data"
      this.toggleTab("profiles");
    },
    async openDirectory() {
      this.loadingStates.addProfile = true;
      this.wizard[this.wizard.mode].directory = (await IPC.invoke("openDirectory")) || "";
      this.loadingStates.addProfile = false;
    },
    // Launch methods
    launch() {
      const selectedProfile = toRaw(this.profiles.find(profile => profile.isSelected));
      const launchProfile = {
        ...toRaw(this.versions.find(version => version.id == selectedProfile.version)),
        profile: selectedProfile,
        account: toRaw(this.accounts.find(account => account.isSelected)) || ("flexberry" + Math.floor(Math.random() * 1000) + 100)
      }
      console.log(launchProfile);
      this.toggleTab();
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
  mounted() {
    this.meta = IPC.sendSync("getMeta"); 
    this.resetWizard();

    IPC.on("pong", (meta) => {
      for (const event of meta.call) {
        IPC.invoke(event).then(result => {
          let eventToInvoke = this.eventsToInvoke.find(e => e.name == event);
          if (eventToInvoke.bindIntoState)
            this.loadingStates[eventToInvoke.data] = false;
          this[eventToInvoke.data] = result;
          eventToInvoke.loaded = true;
          if (this.eventsToInvoke.every(e => e.loaded) && !this.loadingStates.launcher)
            this.load();
          // console.log(`Loaded ${event} from ${eventToInvoke.association} with ${result.length} data length`);
        }).catch(error => {
          // alert(`Error while loading ${event}: ${error}`);
          console.error(error.stack);
        });

      }
    });

    IPC.on("profiles", (profiles) => {
      this.loadingStates.addProfile = false;
      if (!profiles || profiles.status == "error") {
        profiles?.message && alert(profiles.message);
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

    document.addEventListener("click", async (e) => {
      if (e.target.classList.contains("profileAction")) {
        this.tooltip.visible = false;
        this.tooltip.visible = true;
        // ^ To play transition
      }
      this.tooltip.visible = false;
    });

    // Demo code of skin library
    /* (async () => {
      const skinViewer = new skinview3d.SkinViewer({
        width: 200,
        height: 300,
        renderPaused: true
      });
  
      skinViewer.camera.rotation.y = -0.4;
      skinViewer.camera.position.x = -18;
      skinViewer.fov = 30;
      skinViewer.nameTag = "kuzey_"

      console.time("skin");
      const skins = ["00001", "00002", "00003", "00004", "00005", "00006", "00007", "00008", "00009", "00010", "00011", "00012", "00013", "00014", "00015", "00016", "00017", "00018", "00019", "00020", "00021", "00022", "00023", "00024", "00025", "00026", "00027", "00028", "00029", "00030", "00031", "00032", "00033", "00034", "00035", "00036", "00037", "00038", "00039", "00040", "00041", "00042", "00043", "00044", "00045", "00046", "00047", "00048", "00049", "00050", "00051", "00052", "00053", "00054", "00055", "00056", "00057", "00058", "00059", "00060", "00061", "00062", "00063", "00064", "00065", "00066", "00067", "00068", "00069", "00070", "00071", "00072", "00073", "00074", "00075", "00076", "00077", "00078", "00079", "00080", "00081", "00082", "00083", "00084", "00085", "00086", "00087", "00088", "00089", "00090", "00091", "00092", "00093", "00094", "00095", "00096", "00097", "00098", "00099", "00100"];
      for (const skin of skins) {
        await skinViewer.loadSkin(`https://jcpopipvurwaefwngpnh.supabase.co/storage/v1/object/public/skins/general/${skin}.png`);
        await skinViewer.render();
        this.images += (skinViewer.canvas.toDataURL());
        console.log(`Loaded ${skin}`);
      }
      console.timeEnd("skin");
    })(); */

    IPC.send("ping");
  }
}).mount("#app");