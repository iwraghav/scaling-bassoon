/**
 * BIDCG Coaching Centre — Deoria
 * Navigation drawer, batch clock, reveals, forms, downloads, modals.
 * No dependencies.
 */

(function () {
  "use strict";

  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  document.addEventListener("DOMContentLoaded", function () {
    initDrawer();
    initBatchClock();
    initReveals();
    initPrefillLinks();
    initAdmissionForm();
    initStudyMaterialDownloads();
    initModals();
    initSmoothScroll();
    initFloatingActions();
    initSlideshow();
  });

  /* ------------------------------------------------------------------------
     1. Navigation drawer — the only navigation, at every width
     ------------------------------------------------------------------------ */
  function initDrawer() {
    var toggle = document.querySelector("#menu-toggle");
    var nav = document.querySelector("#main-nav");
    if (!toggle || !nav) return;

    var scrim = document.querySelector("#nav-scrim");
    var closeBtn = nav.querySelector("#nav-drawer-close");
    var links = nav.querySelectorAll(".nav-link, .nav-drawer-actions a");

    function isOpen() {
      return nav.classList.contains("is-open");
    }

    function setOpen(open) {
      if (open) {
        nav.classList.remove("is-closing");
        nav.classList.add("is-open");
      } else {
        nav.classList.remove("is-open");
        nav.classList.add("is-closing");
      }
      if (scrim) scrim.classList.toggle("is-visible", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", open);

      if (open) {
        (closeBtn || nav).focus({ preventScroll: true });
      }
    }

    nav.addEventListener("animationend", function (event) {
      if (event.animationName === "drawer-out") {
        nav.classList.remove("is-closing");
      }
    });

    function close(returnFocus) {
      if (!isOpen()) return;
      var hadFocus = nav.contains(document.activeElement);
      setOpen(false);
      if (returnFocus !== false && hadFocus) {
        toggle.focus({ preventScroll: true });
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    if (closeBtn) closeBtn.addEventListener("click", function () { close(); });
    if (scrim) scrim.addEventListener("click", function () { close(); });

    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener("click", function () { close(false); });
    });

    document.addEventListener("keydown", function (event) {
      if (!isOpen()) return;

      if (event.key === "Escape") {
        close();
        return;
      }

      if (event.key !== "Tab") return;

      var items = Array.prototype.filter.call(
        nav.querySelectorAll(FOCUSABLE),
        function (el) { return el.offsetParent !== null; }
      );
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // A resize past the breakpoint should never leave the page locked
    window.addEventListener("resize", function () {
      if (isOpen() && window.innerWidth > 1200) close(false);
    });
  }

  /* ------------------------------------------------------------------------
     2. Batch clock — a real reading of the 5–7 a.m. and 2–9 p.m. batches
     ------------------------------------------------------------------------ */
  function initBatchClock() {
    var clock = document.querySelector("[data-batch-clock]");
    if (!clock) return;

    var text = clock.querySelector("[data-clock-text]");
    var detail = clock.querySelector("[data-clock-detail]");
    if (!text || !detail) return;

    var MORNING_OPENS = 5 * 60;
    var MORNING_CLOSES = 7 * 60;
    var EVENING_OPENS = 14 * 60;
    var EVENING_CLOSES = 21 * 60;

    function minutesInDeoria() {
      var now = new Date();
      var utc = now.getUTCHours() * 60 + now.getUTCMinutes();
      return (utc + 330) % 1440; // IST is UTC+5:30
    }

    function render() {
      var m = minutesInDeoria();
      var live = (m >= MORNING_OPENS && m < MORNING_CLOSES) ||
        (m >= EVENING_OPENS && m < EVENING_CLOSES);

      if (m >= MORNING_OPENS && m < MORNING_CLOSES) {
        text.textContent = "In class now, until 7 a.m.";
        detail.textContent = "Morning batch. Office opens at 9 a.m. for visits and counselling.";
      } else if (m >= EVENING_OPENS && m < EVENING_CLOSES) {
        text.textContent = "In class now, until 9 p.m.";
        detail.textContent = "Afternoon and evening batches. Walk in for counselling until 7 p.m.";
      } else if (m < MORNING_OPENS) {
        text.textContent = "Next batch at 5 a.m.";
        detail.textContent = "Doors open 9 a.m. for visits and counselling.";
      } else if (m < EVENING_OPENS) {
        text.textContent = "Next batch at 2 p.m.";
        detail.textContent = "Counselling runs until 7 p.m. today.";
      } else {
        text.textContent = "Next batch at 5 a.m.";
        detail.textContent = "Tomorrow morning. Counselling from 9 a.m.";
      }

      clock.setAttribute("data-state", live ? "live" : "resting");
    }

    render();
    window.setInterval(render, 60000);
  }

  /* ------------------------------------------------------------------------
     3. Reveals — content is only ever hidden when motion is welcome
     ------------------------------------------------------------------------ */
  function initReveals() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return;

    var root = document.documentElement;
    var animated = root.classList.contains("motion") && "IntersectionObserver" in window;

    if (!animated) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var seen = 0;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = Math.min(seen++, 5) * 55 + "ms";
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------------
     4. Programme links prefill the admission form
     ------------------------------------------------------------------------ */
  function initPrefillLinks() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-prefill]"), function (link) {
      link.addEventListener("click", function () {
        prefillAdmission(link.getAttribute("data-prefill"));
      });
    });
  }

  function prefillAdmission(programme) {
    if (!programme) return;

    var select = document.querySelector("#student-class");
    var message = document.querySelector("#student-message");
    var nameField = document.querySelector("#student-name");
    var matched = false;

    if (message) {
      message.value =
        "Enquiring about " + programme +
        ". Please share the batch timings and the demo class schedule.";
    }

    if (select) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === programme) {
          select.selectedIndex = i;
          matched = true;
          break;
        }
      }
    }

    var target = matched ? nameField : select;
    if (!target) return;

    window.setTimeout(function () {
      target.focus({ preventScroll: true });
    }, 700);
  }

  /* ------------------------------------------------------------------------
     5. Admission form — inline errors, no alert dialogs
     ------------------------------------------------------------------------ */
  function initAdmissionForm() {
    var form = document.querySelector("#admission-form");
    if (!form) return;

    var studentName = document.querySelector("#student-name");
    var parentName = document.querySelector("#parent-name");
    var phone = document.querySelector("#contact-phone");
    var studentClass = document.querySelector("#student-class");
    var board = document.querySelector("#student-board");
    var message = document.querySelector("#student-message");
    var consent = document.querySelector("#consent-check");
    var PHONE = /^[6-9]\d{9}$/;

    if (phone) {
      phone.addEventListener("input", function () {
        phone.value = phone.value.replace(/\D/g, "").slice(0, 10);
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      Array.prototype.forEach.call(
        form.querySelectorAll(".field-error"),
        function (el) { el.textContent = ""; }
      );

      var name = studentName ? studentName.value.trim() : "";
      var phoneValue = phone ? phone.value.trim() : "";
      var classValue = studentClass ? studentClass.value : "";
      var valid = true;

      if (name.length < 2) {
        setError("#student-name-error", "Please enter the student's name.");
        valid = false;
      }

      if (!PHONE.test(phoneValue)) {
        setError("#contact-phone-error", "Enter a 10-digit mobile number starting 6 to 9.");
        valid = false;
      }

      if (!classValue) {
        setError("#student-class-error", "Choose the class the student is in.");
        valid = false;
      }

      if (consent && !consent.checked) {
        setError("#consent-error", "Please allow us to call or message you about the demo class.");
        valid = false;
      }

      if (!valid) {
        var firstInvalid = form.querySelector(".field-error:not(:empty)");
        var field = firstInvalid && firstInvalid.previousElementSibling;
        if (field && field.focus) field.focus({ preventScroll: false });
        return;
      }

      var parent = parentName ? parentName.value.trim() : "";
      var boardValue = board ? board.value : "CBSE / UP Board";
      var note = message ? message.value.trim() : "";

      try {
        var saved = JSON.parse(window.localStorage.getItem("bidcg_admissions") || "[]");
        saved.push({
          studentName: name,
          parentName: parent,
          phone: phoneValue,
          studentClass: classValue,
          board: boardValue,
          query: note,
          submittedAt: new Date().toISOString()
        });
        window.localStorage.setItem("bidcg_admissions", JSON.stringify(saved));
      } catch (err) {
        /* private mode — the WhatsApp hand-off still works */
      }

      var waText = encodeURIComponent(
        "Hello BIDCG Coaching Centre, I would like to register for a free 2-day demo class:\n\n" +
        "Student: " + name + "\n" +
        (parent ? "Parent: " + parent + "\n" : "") +
        "Mobile: " + phoneValue + "\n" +
        "Class: " + classValue + " (" + boardValue + ")\n" +
        (note ? "Note: " + note + "\n\n" : "\n") +
        "Centre: Somnath Mandir, Near Cold Storage, Ward No 7, By Pass Kasia Road, Deoria."
      );

      var waLink = document.querySelector("#success-whatsapp-link");
      if (waLink) waLink.href = "https://wa.me/918218699604?text=" + waText;

      var summary = document.querySelector("#success-modal-summary");
      if (summary) {
        summary.textContent =
          "Thank you, " + name + ". Your demo class enquiry for " + classValue +
          " is recorded. Our academic team will call " + phoneValue + " within 2 hours.";
      }

      openModal("success-modal");
      form.reset();
    });
  }

  function setError(selector, text) {
    var el = document.querySelector(selector);
    if (el) el.textContent = text;
  }

  /* ------------------------------------------------------------------------
     6. Free study material — inline errors, direct download
     ------------------------------------------------------------------------ */
  var activeResource = null;

  function initStudyMaterialDownloads() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-material]"), function (button) {
      button.addEventListener("click", function () {
        requestStudyMaterial(
          button.getAttribute("data-material"),
          button.getAttribute("data-class") || "Class 10",
          button.getAttribute("data-subject") || "Mathematics",
          button.getAttribute("data-size") || "1.5 MB"
        );
      });
    });

    var leadForm = document.querySelector("#resource-lead-form");
    if (!leadForm) return;

    var nameInput = document.querySelector("#lead-name");
    var phoneInput = document.querySelector("#lead-phone");

    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
      });
    }

    leadForm.addEventListener("submit", function (event) {
      event.preventDefault();

      setError("#lead-name-error", "");
      setError("#lead-phone-error", "");

      var name = nameInput ? nameInput.value.trim() : "";
      var phone = phoneInput ? phoneInput.value.trim() : "";
      var valid = true;

      if (name.length < 2) {
        setError("#lead-name-error", "Please enter the student's name.");
        valid = false;
      }
      if (!/^[6-9]\d{9}$/.test(phone)) {
        setError("#lead-phone-error", "Enter a 10-digit mobile number starting 6 to 9.");
        valid = false;
      }
      if (!valid) return;

      var resource = activeResource || {
        title: "Study Notes",
        studentClass: "Class 10",
        subject: "Mathematics",
        size: "1.5 MB"
      };

      var waText = encodeURIComponent(
        "Hello BIDCG Coaching Centre,\nI am " + name + " (" + phone + ").\n" +
        "Please share the download link for: " + resource.title +
        " (" + resource.studentClass + " · " + resource.subject + ").\nThank you!"
      );
      window.open("https://wa.me/918218699604?text=" + waText, "_blank", "noopener,noreferrer");

      var safeName = resource.title.replace(/[^a-zA-Z0-9_-]/g, "_");
      var guide =
        "============================================================\n" +
        "BIDCG COACHING CENTRE — DEORIA\n" +
        "Academic Session 2026-27 | Somnath Mandir, Kasia Road\n" +
        "============================================================\n\n" +
        "Subject Guide: " + resource.title + "\n" +
        "Class: " + resource.studentClass + " | Subject: " + resource.subject + "\n" +
        "Prepared for: " + name + "\n\n" +
        "KEY FORMULAS & CHAPTER REVISION POINTERS:\n" +
        "1. Chapter-wise definitions and high-yield derivations.\n" +
        "2. Board theorem statements with step-by-step proofs.\n" +
        "3. Solved past-year board questions (CBSE & UP Board 2020-2025).\n" +
        "4. Common exam pitfalls and marking scheme guidance.\n\n" +
        "For 1-on-1 doubt solving and classroom coaching:\n" +
        "Visit the centre: Somnath Mandir, Near Cold Storage, Ward No 7, Kasia Road, Deoria.\n" +
        "Helpline: +91 82186 99604 | Batches: 5-7 a.m. and 2-9 p.m.\n";

      var blob = new Blob([guide], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = safeName + "_BIDCG.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 2000);

      closeModal("resource-lead-modal");
      leadForm.reset();
      activeResource = null;
    });
  }

  function requestStudyMaterial(title, studentClass, subject, size) {
    activeResource = {
      title: title,
      studentClass: studentClass,
      subject: subject,
      size: size
    };

    var modalTitle = document.querySelector("#resource-lead-title");
    var modalSubtitle = document.querySelector("#resource-lead-subtitle");

    if (modalTitle) modalTitle.textContent = "Download \u201C" + title + "\u201D";
    if (modalSubtitle) {
      modalSubtitle.textContent =
        "Free study guide for " + studentClass + " \u00B7 " + subject +
        " (" + size + "). Enter your details to download it now.";
    }

    setError("#lead-name-error", "");
    setError("#lead-phone-error", "");
    openModal("resource-lead-modal");
  }

  /* ------------------------------------------------------------------------
     7. Modals — focus moves in, and comes back out
     ------------------------------------------------------------------------ */
  var lastFocused = null;

  function initModals() {
    Array.prototype.forEach.call(
      document.querySelectorAll(".modal-close-btn, [data-modal-close]"),
      function (button) {
        button.addEventListener("click", function () {
          var modal = button.closest(".modal-overlay");
          if (modal) closeModal(modal.id);
        });
      }
    );

    Array.prototype.forEach.call(document.querySelectorAll(".modal-overlay"), function (overlay) {
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) closeModal(overlay.id);
      });
    });

    document.addEventListener("keydown", function (event) {
      var open = document.querySelector(".modal-overlay.is-active");
      if (!open) return;

      if (event.key === "Escape") {
        closeModal(open.id);
        return;
      }

      if (event.key !== "Tab") return;

      var items = Array.prototype.filter.call(
        open.querySelectorAll(FOCUSABLE),
        function (el) { return el.offsetParent !== null; }
      );
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;

    lastFocused = document.activeElement;
    modal.classList.add("is-active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    var target = modal.querySelector(".modal-title, " + FOCUSABLE) || modal;
    window.setTimeout(function () {
      if (target.focus) target.focus({ preventScroll: true });
    }, 40);
  }

  function closeModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.remove("is-active");
    modal.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".modal-overlay.is-active")) {
      document.body.classList.remove("modal-open");
    }

    if (lastFocused && lastFocused.focus) {
      lastFocused.focus({ preventScroll: true });
      lastFocused = null;
    }
  }

  /* ------------------------------------------------------------------------
     8. Anchor navigation and section highlighting
     ------------------------------------------------------------------------ */
  function initSmoothScroll() {
    var header = document.querySelector(".site-header");
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".main-nav .nav-link"));

    function headerOffset() {
      return (header ? header.offsetHeight : 76) + 12;
    }

    function setActive(hash) {
      navLinks.forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("href") === hash);
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll('a[href^="#"]'), function (link) {
      link.addEventListener("click", function (event) {
        var hash = link.getAttribute("href");
        if (!hash || hash === "#") return;

        var target = document.querySelector(hash);
        if (!target) return;

        event.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
        window.scrollTo({
          top: Math.max(0, top),
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        });
        if (history.replaceState) history.replaceState(null, "", hash);
        setActive(hash);
      });
    });

    var sections = document.querySelectorAll("section[id]");
    if (!sections.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive("#" + entry.target.id);
      });
    }, { rootMargin: "-30% 0px -55% 0px", threshold: 0 });

    Array.prototype.forEach.call(sections, function (section) {
      observer.observe(section);
    });
  }

  /* ------------------------------------------------------------------------
     9. Floating contact buttons — appear once the hero is behind you
     ------------------------------------------------------------------------ */
  function initFloatingActions() {
    var body = document.body;
    var ticking = false;

    function update() {
      var threshold = Math.max(240, window.innerHeight * 0.55);
      body.classList.toggle("is-scrolled", window.scrollY > threshold);
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ------------------------------------------------------------------------
     10. Hero slideshow — two photographs of the room, paused by default
     when motion is not welcome
     ------------------------------------------------------------------------ */
  function initSlideshow() {
    var root = document.querySelector("[data-slideshow]");
    if (!root) return;

    var slides = root.querySelectorAll(".slide");
    if (slides.length < 2) return;

    var prev = root.querySelector("[data-slide-prev]");
    var next = root.querySelector("[data-slide-next]");
    var counter = root.querySelector("[data-slide-current]");
    var index = 0;
    var timer = null;
    var DURATION = 6500;
    var still = window.matchMedia("(prefers-reduced-motion: reduce)");

    function show(target) {
      index = (target + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (slide, i) {
        slide.classList.toggle("is-current", i === index);
        slide.setAttribute("aria-hidden", String(i !== index));
      });
      if (counter) counter.textContent = String(index + 1);
    }

    function start() {
      if (still.matches || timer) return;
      timer = window.setInterval(function () {
        show(index + 1);
      }, DURATION);
    }

    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    if (prev) prev.addEventListener("click", function () { show(index - 1); stop(); start(); });
    if (next) next.addEventListener("click", function () { show(index + 1); stop(); start(); });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    if (still.addEventListener) {
      still.addEventListener("change", function () {
        stop();
        if (!still.matches) start();
      });
    }

    show(0);
    start();
  }
})();
