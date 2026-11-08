// O backend não tem categorias nem imagens de produto.
// Inferimos uma "categoria visual" pelo nome para dar identidade aos cards.

export interface Categoria {
  icone: string;
  nome: string;
  busca: string;
  palavras: string[];
  cor: [string, string];
}

export const CATEGORIAS: Categoria[] = [
  { icone: 'gpu', nome: 'Placas de vídeo', busca: 'placa de video', palavras: ['rtx', 'gtx', 'radeon', 'placa de video', 'geforce', 'rx '], cor: ['#1f3b73', '#3a7bd5'] },
  { icone: 'cpu', nome: 'Processadores', busca: 'processador', palavras: ['processador', 'ryzen', 'intel core', 'core i', 'cpu'], cor: ['#3b1f73', '#7b3ad5'] },
  { icone: 'laptop', nome: 'Notebooks', busca: 'notebook', palavras: ['notebook', 'laptop', 'macbook', 'chromebook'], cor: ['#0f4c5c', '#2a9d8f'] },
  { icone: 'monitor', nome: 'Monitores', busca: 'monitor', palavras: ['monitor', 'tela'], cor: ['#14213d', '#4361ee'] },
  { icone: 'keyboard', nome: 'Teclados', busca: 'teclado', palavras: ['teclado', 'keyboard'], cor: ['#3d1a3a', '#b5179e'] },
  { icone: 'mouse', nome: 'Mouses', busca: 'mouse', palavras: ['mouse', 'mousepad'], cor: ['#2b2d42', '#8d99ae'] },
  { icone: 'headphones', nome: 'Headsets', busca: 'headset', palavras: ['headset', 'fone', 'headphone', 'earbud'], cor: ['#5a189a', '#c77dff'] },
  { icone: 'smartphone', nome: 'Celulares', busca: 'smartphone', palavras: ['celular', 'smartphone', 'iphone', 'galaxy', 'xiaomi', 'motorola'], cor: ['#1b4332', '#40916c'] },
  { icone: 'drive', nome: 'Armazenamento', busca: 'ssd', palavras: ['ssd', 'hd ', 'hdd', 'nvme', 'memoria', 'ram', 'pendrive'], cor: ['#7f4f24', '#dda15e'] },
  { icone: 'gamepad', nome: 'Games', busca: 'controle', palavras: ['controle', 'console', 'playstation', 'xbox', 'nintendo', 'game', 'joystick'], cor: ['#7b2c2c', '#e85d04'] },
];

const PADRAO: Categoria = {
  icone: 'package',
  nome: 'Produtos',
  busca: '',
  palavras: [],
  cor: ['#243447', '#5c7a99'],
};

function normalizar(s: string): string {
  return ` ${s} `
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function categoriaDe(nome: string): Categoria {
  const n = normalizar(nome);
  return CATEGORIAS.find((c) => c.palavras.some((p) => n.includes(p))) ?? PADRAO;
}
