import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getEstimationBgColor = (estimation: string | null): string => {
  if (!estimation || estimation === '?') return 'bg-gray-100';

  switch (estimation) {
    case 'XS': return 'bg-blue-100';
    case 'S': return 'bg-green-100';
    case 'M': return 'bg-orange-100';
    case 'L': return 'bg-red-100';
    case 'XL': return 'bg-purple-100';
    default: return 'bg-gray-100';
  }
};

export const getRepositoryCategory = (repository: string | null): { label: string; bg: string; text: string } => {
  if (!repository) return { label: 'Задача', bg: 'bg-gray-100', text: 'text-gray-800' };

  for (const [category, config] of Object.entries(repositoryCategories)) {
    if (config.repos.includes(repository.toLowerCase())) {
      return { label: category, bg: config.bg, text: config.text };
    }
  }

  return { label: 'Задача', bg: 'bg-gray-100', text: 'text-gray-800' };
};

export const getRiskBgColor = (risk: string | null): string => {
  if (!risk) return 'bg-gray-100';

  switch (risk) {
    case 'XS': return 'bg-orange-100';
    case 'S': return 'bg-red-100';
    case 'M': return 'bg-red-200';
    default: return 'bg-gray-100';
  }
};

export const repositoryCategories = {
  'Frontend': {
    repos: ['frontend', 'xhh', 'docs', 'magritte', 'bloko', 'front-packages'],
    bg: 'bg-yellow-200',
    text: 'text-yellow-900'
  },
  'Configs': {
    repos: ['configs', 'deploy', 'deploy-dev-secure'],
    bg: 'bg-green-100',
    text: 'text-green-800'
  },
  'DB': {
    repos: ['db', 'dbscripts'],
    bg: 'bg-purple-100',
    text: 'text-purple-800'
  },
  'Backend': {
    repos: ['backend', 'hh.ru', 'hhru', 'xmlback', 'billing', 'billing-price', 'mm', 'monetization-manager', 'vacancy-creation', 'vc'],
    bg: 'bg-blue-500',
    text: 'text-white'
  }
};

export const fixJiraLists = (html: string): string => {
  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');

  // Маркеры для вложенных списков
  const nestedMarker = /^(--|#-|-#|##)\s*/;

  // 1. Обработка вложенных <li>
  Array.from(document.querySelectorAll('li')).forEach((li) => {
    const nodes: ChildNode[] = Array.from(li.childNodes);

    let nestedItems: { type: 'ul' | 'ol', text: string }[] = [];
    let hasNested = false;

    nodes.forEach((node) => {
      if (node.nodeType === window.Node.TEXT_NODE) {
        const text = node.textContent ?? '';
        const lines = text.split(/\r?\n/);

        lines.forEach(line => {
          const match = line.trim().match(nestedMarker);
          if (match) {
            hasNested = true;
            const marker = match[1];
            const type = marker.startsWith('#') ? 'ol' : 'ul';
            nestedItems.push({ type, text: line.trim().replace(nestedMarker, '') });
          }
        });
      }

      if (node.nodeName === 'BR') {
        const nextText = node.nextSibling?.textContent?.trim() ?? '';
        const match = nextText.match(nestedMarker);
        if (match) {
          hasNested = true;
          const marker = match[1];
          const type = marker.startsWith('#') ? 'ol' : 'ul';
          nestedItems.push({ type, text: nextText.replace(nestedMarker, '') });
          node.nextSibling!.textContent = '';
        }
      }
    });

    if (hasNested && nestedItems.length) {
      // Группируем по типу (ul/ol)
      let currentType = nestedItems[0].type;
      let currentList = document.createElement(currentType);
      let lists: HTMLElement[] = [currentList];

      nestedItems.forEach((item, idx) => {
        if (item.type !== currentType) {
          currentType = item.type;
          currentList = document.createElement(currentType);
          lists.push(currentList);
        }
        const liNested = document.createElement('li');
        liNested.innerHTML = item.text;
        currentList.appendChild(liNested);
      });

      // чистим мусор в исходном li
      li.childNodes.forEach((node: ChildNode) => {
        if (node.nodeName === 'BR') node.remove();
        if (node.nodeType === window.Node.TEXT_NODE && nestedMarker.test(node.textContent?.trim() ?? '')) {
          node.textContent = '';
        }
      });

      // Вставляем все вложенные списки
      lists.forEach(list => li.appendChild(list));
    }
  });

  // 2. Обработка <p> с маркерами сразу после <ul>/<ol>
  Array.from(document.querySelectorAll('ul,ol')).forEach(list => {
    let next = list.nextElementSibling;
    let lastLi = list.querySelector('li:last-child');
    while (next && next.nodeName === 'P' && nestedMarker.test(next.textContent?.trim() ?? '')) {
      // Собираем все подряд <p> с маркерами
      let nestedItems: { type: 'ul' | 'ol', text: string }[] = [];
      while (next && next.nodeName === 'P' && nestedMarker.test(next.textContent?.trim() ?? '')) {
        const match = next.textContent!.trim().match(nestedMarker);
        if (match) {
          const marker = match[1];
          const type = marker.startsWith('#') ? 'ol' : 'ul';
          nestedItems.push({ type, text: next.textContent!.trim().replace(nestedMarker, '') });
        }
        const toRemove = next;
        next = next.nextElementSibling;
        toRemove.remove();
      }
      // Группируем по типу
      if (nestedItems.length && lastLi) {
        let currentType = nestedItems[0].type;
        let currentList = document.createElement(currentType);
        let lists: HTMLElement[] = [currentList];

        nestedItems.forEach((item, idx) => {
          if (item.type !== currentType) {
            currentType = item.type;
            currentList = document.createElement(currentType);
            lists.push(currentList);
          }
          const liNested = document.createElement('li');
          liNested.innerHTML = item.text;
          currentList.appendChild(liNested);
        });

        lists.forEach(listEl => lastLi.appendChild(listEl));
      }
    }
  });

  return document.body.innerHTML;
}

const ONE = 0;
const SOME = 1;
const MANY = 2;
const TEXT_CASES = [MANY, ONE, SOME, SOME, SOME, MANY];
export const numConversion = (num: number, words: string[]) => {
  const remainder = num % 100;
  if (remainder > 10 && remainder < 15) {
    return words[MANY];
  }
  return words[TEXT_CASES[Math.min(num % 10, 5)]];
}
