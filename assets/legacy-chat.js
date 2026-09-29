/* ============================================================
   CRIMSON INDEX — Mock legacy support chat (video prop)
   Scripted deflection answers, no backend, no real agent.
   ============================================================ */

(function () {
  'use strict';

  const TYPING_MS = 800;
  const BUBBLE_GAP_MS = 420;
  const PROMO_VIDEO_PARAM = 'promo_video';
  const PROMO_VIDEO_MOCK = 'mock';

  const QUICK_REPLIES = [
    'Where is my order?',
    "I'd like to return an item",
    'Talk to a human'
  ];

  const SCRIPTED_ANSWERS = [
    {
      keywords: ['laptop', 'editing', 'light'],
      bubbles: [
        {
          text: 'You can browse all laptops in Computers & Peripherals. Try the filters for price and weight.',
          links: [
            { label: 'Laptops collection', href: '/collections/laptops' },
            { label: 'Compare specifications' }
          ]
        }
      ]
    },
    {
      keywords: ['battery'],
      bubbles: [
        {
          text: 'Battery life varies by model. Check the Specifications tab on each product page, or I can open a support ticket.',
          actions: ['Open a ticket', 'No, thanks']
        }
      ]
    }
  ];

  const FALLBACKS = [
    ["I'm sorry, I didn't quite catch that! Could you try rephrasing your question using different keywords?"],
    [
      "Thank you for that information! I want to make sure I fully understand your request before we continue.",
      "Could you tell me a little more about what you are hoping to achieve today?"
    ],
    [
      "I appreciate your patience! Unfortunately I was not able to find an exact match for your question in our Help Center.",
      "Here are some articles that other customers found helpful: 'Getting Started', 'Shipping & Delivery', 'Contact Us'."
    ]
  ];

  const FEEDBACK_PROMPT = 'Did that answer your question?';
  const FEEDBACK_THANKS = 'Thank you for your feedback! It helps us improve our service.';
  const SESSION_KEY = 'legacy-chat-mock';

  function loadSession() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveSession(state) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode */
    }
  }

  function matchesKeywords(text, keywords) {
    const haystack = text.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  }

  function mockChatRequested() {
    return new URLSearchParams(window.location.search).get(PROMO_VIDEO_PARAM) === PROMO_VIDEO_MOCK;
  }

  function propagateMockChatParam() {
    const updateLink = (link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      url.searchParams.set(PROMO_VIDEO_PARAM, PROMO_VIDEO_MOCK);
      link.href = url.toString();
    };

    const updateForm = (form) => {
      const method = (form.getAttribute('method') || 'get').toLowerCase();
      if (method !== 'get' || form.querySelector(`[name="${PROMO_VIDEO_PARAM}"]`)) return;

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = PROMO_VIDEO_PARAM;
      input.value = PROMO_VIDEO_MOCK;
      form.appendChild(input);
    };

    const updateNode = (node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.matches('a[href]')) updateLink(node);
      if (node.matches('form')) updateForm(node);
      node.querySelectorAll('a[href]').forEach(updateLink);
      node.querySelectorAll('form').forEach(updateForm);
    };

    document.querySelectorAll('a[href]').forEach(updateLink);
    document.querySelectorAll('form').forEach(updateForm);

    new MutationObserver((records) => {
      records.forEach(record => record.addedNodes.forEach(updateNode));
    }).observe(document.body, { childList: true, subtree: true });
  }

  class LegacyChat {
    constructor(root) {
      this.root = root;
      this.brand = root.dataset.brand || 'Dull Chatbot';
      this.avatarTemplate = root.querySelector('.legacy-chat__header .legacy-chat__avatar');

      this.window = root.querySelector('[data-legacy-chat-window]');
      this.launcher = root.querySelector('[data-legacy-chat-toggle]');
      this.log = root.querySelector('[data-legacy-chat-log]');
      this.quick = root.querySelector('[data-legacy-chat-quick]');
      this.composer = root.querySelector('[data-legacy-chat-composer]');
      this.input = root.querySelector('[data-legacy-chat-input]');

      this.hasStarted = false;
      this.chipsDismissed = false;
      this.fallbackIndex = 0;
      this.exchanges = 0;
      this.entries = [];

      this.bindEvents();
      this.restoreSession();
    }

    bindEvents() {
      this.launcher.addEventListener('click', () => this.toggle());
      this.root.querySelector('[data-legacy-chat-close]')?.addEventListener('click', () => this.close());

      this.composer.addEventListener('submit', (event) => {
        event.preventDefault();
        const text = this.input.value.trim();
        if (!text) return;
        this.input.value = '';
        this.sendVisitorMessage(text);
      });
    }

    isOpen() {
      return !this.window.hidden;
    }

    toggle() {
      this.isOpen() ? this.close() : this.open();
    }

    open(options = {}) {
      this.window.hidden = false;
      this.launcher.setAttribute('aria-expanded', 'true');
      this.root.classList.add('is-open');
      if (!this.hasStarted) this.startConversation();
      this.persistSession();
      if (!options.fromSession) this.input.focus();
    }

    close() {
      this.window.hidden = true;
      this.launcher.setAttribute('aria-expanded', 'false');
      this.root.classList.remove('is-open');
      this.persistSession();
    }

    startConversation() {
      this.hasStarted = true;
      if (!this.chipsDismissed) this.renderQuickReplies();
      this.persistSession();
    }

    persistSession() {
      saveSession({
        open: this.isOpen(),
        hasStarted: this.hasStarted,
        chipsDismissed: this.chipsDismissed,
        fallbackIndex: this.fallbackIndex,
        exchanges: this.exchanges,
        entries: this.entries
      });
    }

    rememberEntry(entry) {
      this.entries.push(entry);
      this.persistSession();
    }

    restoreSession() {
      const saved = loadSession();
      if (!saved) return;

      this.hasStarted = Boolean(saved.hasStarted);
      this.chipsDismissed = Boolean(saved.chipsDismissed);
      this.fallbackIndex = Number(saved.fallbackIndex) || 0;
      this.exchanges = Number(saved.exchanges) || 0;
      this.entries = Array.isArray(saved.entries) ? saved.entries : [];

      this.entries.forEach((entry) => {
        if (entry.type === 'feedback') {
          this.renderFeedback(entry);
          return;
        }
        this.renderMessage(entry);
      });

      if (this.hasStarted && !this.chipsDismissed) this.renderQuickReplies();
      if (saved.open) this.open({ fromSession: true });
    }

    renderQuickReplies() {
      if (this.chipsDismissed) return;
      this.quick.hidden = false;
      this.quick.innerHTML = '';
      QUICK_REPLIES.forEach(label => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'legacy-chat__chip';
        chip.textContent = label;
        chip.addEventListener('click', () => this.sendVisitorMessage(label));
        this.quick.appendChild(chip);
      });
    }

    dismissQuickReplies() {
      this.chipsDismissed = true;
      this.quick.innerHTML = '';
      this.quick.hidden = true;
      this.persistSession();
    }

    sendVisitorMessage(text) {
      this.dismissQuickReplies();
      this.rememberEntry({ type: 'message', author: 'visitor', text });
      this.renderMessage({ author: 'visitor', text, links: [], actions: [] });
      this.exchanges += 1;

      const botEntries = this.answerFor(text).map((bubble) => ({
        type: 'message',
        author: 'bot',
        ...this.normalizeBubble(bubble)
      }));
      const feedbackEntry = { type: 'feedback', answered: false };
      botEntries.forEach((entry) => this.rememberEntry(entry));
      this.rememberEntry(feedbackEntry);
      this.playBotEntries(botEntries, feedbackEntry);
    }

    answerFor(text) {
      const match = SCRIPTED_ANSWERS.find((answer) => matchesKeywords(text, answer.keywords));
      if (match) return match.bubbles;

      const fallback = FALLBACKS[this.fallbackIndex % FALLBACKS.length];
      this.fallbackIndex += 1;
      return fallback;
    }

    playBotEntries(botEntries, feedbackEntry) {
      let delay = 0;

      botEntries.forEach((entry, index) => {
        setTimeout(() => this.showTyping(), delay);
        delay += TYPING_MS;
        setTimeout(() => {
          this.hideTyping();
          this.renderMessage(entry);
          if (index === botEntries.length - 1 && feedbackEntry) {
            this.renderFeedback(feedbackEntry);
          }
        }, delay);
        delay += BUBBLE_GAP_MS;
      });
    }

    interpolate(text) {
      return String(text).replace('{brand}', this.brand);
    }

    normalizeLink(link) {
      if (typeof link === 'string') return { label: link, href: '' };
      return { label: link.label || '', href: link.href || '' };
    }

    normalizeBubble(payload) {
      if (typeof payload === 'string' || payload == null) {
        return { text: payload ? String(payload) : '', links: [], actions: [] };
      }

      return {
        text: payload.text || '',
        links: payload.links || [],
        actions: payload.actions || []
      };
    }

    createAvatar() {
      if (!this.avatarTemplate) return null;
      return this.avatarTemplate.cloneNode(true);
    }

    renderMessage(entry) {
      const author = entry.author === 'visitor' ? 'visitor' : 'bot';
      const content = {
        text: entry.text || '',
        links: entry.links || [],
        actions: entry.actions || []
      };

      const row = document.createElement('div');
      row.className = `legacy-chat__msg legacy-chat__msg--${author}`;

      if (author === 'bot') {
        const avatar = this.createAvatar();
        if (avatar) row.appendChild(avatar);
      }

      const bubble = document.createElement('div');
      bubble.className = 'legacy-chat__bubble';

      const text = document.createElement('p');
      text.className = 'legacy-chat__bubble-text';
      text.textContent = this.interpolate(content.text);
      bubble.appendChild(text);

      if (content.links.length) {
        const list = document.createElement('ul');
        list.className = 'legacy-chat__bubble-links';
        content.links.forEach((linkEntry) => {
          const { label, href } = this.normalizeLink(linkEntry);
          const item = document.createElement('li');
          const link = href ? document.createElement('a') : document.createElement('button');
          link.className = 'legacy-chat__fake-link';
          link.textContent = label;
          if (href) {
            link.href = href;
          } else {
            link.type = 'button';
          }
          item.appendChild(link);
          list.appendChild(item);
        });
        bubble.appendChild(list);
      }

      if (content.actions.length) {
        const actions = document.createElement('div');
        actions.className = 'legacy-chat__actions';
        content.actions.forEach((label) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'legacy-chat__action';
          button.textContent = label;
          actions.appendChild(button);
        });
        bubble.appendChild(actions);
      }

      row.appendChild(bubble);
      this.log.appendChild(row);
      this.scrollToLatest();
    }

    renderFeedback(entry) {
      const row = document.createElement('div');
      row.className = 'legacy-chat__feedback';

      if (entry.answered) {
        row.textContent = FEEDBACK_THANKS;
        row.classList.add('is-answered');
        this.log.appendChild(row);
        this.scrollToLatest();
        return;
      }

      const label = document.createElement('span');
      label.textContent = FEEDBACK_PROMPT;
      row.appendChild(label);

      ['👍', '👎'].forEach((glyph) => {
        const vote = document.createElement('button');
        vote.type = 'button';
        vote.className = 'legacy-chat__vote';
        vote.textContent = glyph;
        vote.addEventListener('click', () => {
          row.textContent = FEEDBACK_THANKS;
          row.classList.add('is-answered');
          entry.answered = true;
          this.persistSession();
        });
        row.appendChild(vote);
      });

      this.log.appendChild(row);
      this.scrollToLatest();
    }

    showTyping() {
      if (this.typingRow) return;
      this.typingRow = document.createElement('div');
      this.typingRow.className = 'legacy-chat__typing';

      const avatar = this.createAvatar();
      if (avatar) this.typingRow.appendChild(avatar);

      const dots = document.createElement('span');
      dots.className = 'legacy-chat__dots';
      dots.innerHTML = '<i></i><i></i><i></i>';
      this.typingRow.appendChild(dots);

      this.log.appendChild(this.typingRow);
      this.scrollToLatest();
    }

    hideTyping() {
      this.typingRow?.remove();
      this.typingRow = null;
    }

    scrollToLatest() {
      this.log.scrollTop = this.log.scrollHeight;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!mockChatRequested()) return;

    propagateMockChatParam();

    const root = document.querySelector('[data-legacy-chat]');
    if (!root) return;

    root.hidden = false;
    new LegacyChat(root);
  });
})();
