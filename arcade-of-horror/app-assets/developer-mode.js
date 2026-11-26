(function () {
  "use strict";

  const enabled = false;

  window.ArcadeDeveloperMode = {
    enabled,
    label: enabled ? "Arcade of Horror Developer" : "",
    isEnabled() {
      return enabled;
    },
    preventDeath() {
      return enabled;
    },
    markUnlocked() {
      return enabled;
    }
  };
})();
