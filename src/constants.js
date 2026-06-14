// constants.js

export const CATEGORY_MAP = {
  comida: [
    'mercadona', 'carrefour', 'lidl', 'super', 'supermercado', 'restaurante', 'cena', 'comida',
    'burger', 'burguer', 'pizza', 'dia', 'alimerka', 'gadis', 'compra', 'mercado',
    'pan', 'leche', 'fruta', 'verdura', 'carne', 'pescado', 'cafeteria', 'café',
    'desayuno', 'almuerzo', 'merienda', 'kebab', 'sushi', 'taco', 'pasta', 'helado',
    'vino', 'cerveza', 'refresco', 'bebida', 'panaderia', 'pasteleria', 'chino',
    'McDonald', 'kfc', 'dominos', 'telepizza', 'glovo', 'uber eats', 'just eat',
    'deliveroo', 'aldi', 'consume', 'gallina', 'blanca', 'el corte ingles', 'hipercor',
    'alcampo', 'ebaki', 'ametller', 'bonpreu', 'condis', 'coviran', 'masymas',
    'familia', 'consum', 'sprinter', 'herbolario', 'dulce', 'snack', 'bocadillo',
    'sandwich', 'ensalada', 'sopa', 'arroceria', 'marisqueria', 'churreria',
    'horchateria', 'pollo', 'cofrade', 'horno', 'la despen', 'apetit', 'miso',
    'ramen', 'poke', 'wok', 'italiano', 'mexicano', 'japones', 'thai', 'indio',
    'kilo', 'pescaderia', 'carniceria', 'fruteria'
  ],
  transporte: [
    'gasolina', 'uber', 'cabify', 'bus', 'autobus', 'tren', 'metro', 'parking', 'peaje',
    'renfe', 'repsol', 'cepsa', 'taxi', 'vuelo', 'avion', 'aeropuerto', 'billete',
    'gasoil', 'diesel', 'gasoleo', 'carga', 'coche', 'bicicleta', 'bici', 'patinete',
    'blablacar', 'carpool', 'vtc', 'bolt', 'freenow', 'alquiler coche', 'rent a car',
    'autopista', 'aparcamiento', 'parkimetro', 'zona azul', 'ser', 'iberdrola coche',
    'taller', 'neumatico', 'rueda', 'aceite', 'itv', 'seguro coche', 'seguro auto',
    'viaje', 'tren', 'ave', 'cercanias', 'rodalies', 'tram', 'tranvia', 'ferrocarril',
    'barco', 'ferry', 'scooter', 'moto', 'gasolinera', 'petroleo', 'carburante',
    'recarga coche', 'electrica coche', 'wallbox', 'endesa x'
  ],
  hogar: [
    'alquiler', 'luz', 'agua', 'gas', 'internet', 'ikea', 'leroy', 'reparacion',
    'endesa', 'iberdrola', 'comunidad', 'hipoteca', 'seguro hogar', 'seguro piso',
    'electricidad', 'factura luz', 'factura gas', 'butano', 'propano', 'calefaccion',
    'fontaneria', 'electricista', 'pintor', 'obra', 'reforma', 'mudanza', 'transporte mudanza',
    'mueble', 'decoracion', 'cortina', 'sabanas', 'toalla', 'cocina', 'horno',
    'nevera', 'lavadora', 'lavavajillas', 'microondas', 'aspiradora', 'aire acondicionado',
    'climatizacion', 'termostato', 'bombilla', 'led', 'ferreteria', 'bricomart',
    'bricodepot', 'bricor', 'manitas', 'cerrajero', 'llaves', 'cerradura',
    'limpieza', 'productos limpieza', 'fregona', 'escoba', 'recibo', 'suministro',
    'lowi', 'digi', 'masmovil', 'vodafone', 'movistar', 'orange', 'fibra',
    'telefono', 'movil factura', 'netllar', 'jazztel', 'pepephone', 'simyo',
    'tuenti', 'finetwork', 'yoigo', 'telecable', 'adam'
  ],
  ocio: [
    'cine', 'cañas', 'concierto', 'fiesta', 'gimnasio', 'gym', 'ocio', 'cerveza', 'copas', 'bar',
    'padel', 'pádel', 'tenis', 'futbol', 'baloncesto', 'running', 'deporte', 'crossfit',
    'yoga', 'pilates', 'natacion', 'senderismo', 'escalada', 'deporte',
    'musica', 'teatro', 'festival', 'museo', 'exposicion', 'concierto',
    'videojuego', 'playstation', 'xbox', 'nintendo', 'steam', 'epic games',
    'discoteca', 'pub', 'pub', 'club', 'botellon', 'after',
    'viaje', 'hotel', 'hostal', 'airbnb', 'booking', 'vuelo ocio',
    'playa', 'piscina', 'spa', 'balneario', 'masaje',
    'juegos', 'juego mesa', 'escape room', 'karaoke', 'bolos', 'bowling',
    'billar', 'dardos', 'paintball', 'laser tag', 'go kart', 'karting',
    'parque', 'atracciones', 'zoo', 'aquarium', 'parque natural',
    'libro', 'libreria', 'ebook', 'kindle', 'lectura',
    'netflix', 'spotify', 'hbo', 'disney', 'fotografia', 'vlog',
    'tinder', 'ligar'
  ],
  educación: [
    'curso', 'formacion', 'formación', 'master', 'máster', 'clase', 'academia',
    'escuela', 'colegio', 'universidad', 'matricula', 'matrícula', 'estudios',
    'material escolar', 'libro de texto'
  ],
  salud: [
    'farmacia', 'dentista', 'medico', 'fisio', 'psicologo', 'optica',
    'hospital', 'clinica', 'urgencias', 'medicina', 'medicamento', 'pastilla',
    'seguro medico', 'sanitas', 'adeslas', 'asisa', 'mapfre salud', 'dkv',
    'analisis', 'radiografia', 'ecografia', 'revision', 'ginecologo',
    'pediatra', 'traumatologo', 'dermatologo', 'oftalmologo', 'cardiologo',
    'neurologo', 'endocrino', 'nutricionista', 'dietista',
    'farmacia', 'parafarmacia', 'ortopedia', 'gafas', 'lentillas', 'audifono',
    'vacuna', 'veterinario', 'veterinaria', 'perro', 'gato', 'mascota',
    'protectora', 'ambulancia', 'fisioterapia', 'rehabilitacion', 'quiromasaje',
    'osteopata', 'podologo', 'logopeda', 'terapeuta', 'acupuntura'
  ],
  suscripciones: [
    'netflix', 'spotify', 'disney', 'amazon prime', 'hbo', 'dazn', 'apple', 'icloud',
    'youtube premium', 'youtube music', 'amazon music', 'tidal', 'deezer',
    'prime video', 'hbo max', 'hbo max', 'sky', 'movistar plus', 'vodafone tv',
    'paramount', 'crunchyroll', 'funimation', 'mubi', 'filmin',
    'patreon', 'twitch', 'twitch sub', 'kick',
    'chatgpt', 'midjourney', 'copilot', 'github copilot',
    'notion', 'figma', 'canva', 'adobe', 'creative cloud', 'office 365',
    'google one', 'google drive', 'dropbox', 'onedrive', 'mega',
    'vpn', 'nordvpn', 'expressvpn', 'surfshark',
    'antivirus', 'norton', 'mcafee', 'kaspersky',
    'dominio', 'hosting', 'servidor', 'vps', 'namecheap', 'godaddy',
    'duolingo', 'headspace', 'calm', 'strava', 'fitbit premium',
    'apple music', 'apple tv', 'apple arcade', 'icloud+',
    'onlyfans', 'x premium', 'twitter blue', 'meta verified',
    'substack', 'medium premium', 'ny times', 'elpais'
  ],
  compras: [
    'zara', 'h&m', 'amazon', 'aliexpress', 'ropa', 'tecnologia', 'shein', 'nike',
    'adidas', 'puma', 'decathlon', 'el corte ingles', 'primark', 'mango', 'bershka',
    'stradivarius', 'pull&bear', 'cortefiel', 'springfield', 'lefties', 'oysho',
    'intimissimi', 'calzedonia', 'tezenis', 'women secret', 'sfera',
    'mediamarkt', 'pccomponentes', 'worten', 'fnac', 'casa del libro',
    'zapatos', 'zapatilla', 'bolso', 'cartera', 'accesorio', 'complemento',
    'movil', 'telefono', 'tablet', 'ordenador', 'portatil', 'cascos', 'auriculares',
    'reloj', 'smartwatch', 'pulsera', 'gafas sol',
    'jardineria', 'bricolaje', 'bazar', 'todo a 100', 'tiger', 'miniso', 'action',
    'perfume', 'colonia', 'maquillaje', 'cosmetica', 'crema', 'protector solar',
    'sephora', 'primor', 'druni', 'perfumerias',
    'juguete', 'tienda online', 'envio', 'pedido',
    'carrefour ropa', 'fashion', 'moda', 'vestido', 'pantalon', 'camiseta',
    'chaqueta', 'abrigo', 'bufanda', 'gorro', 'guantes', 'calcetines',
    'outlet', 'rebajas', 'segunda mano', 'vinted', 'wallapop', 'mil anuncios'
  ]
};

export const BASE_EXPENSE_CATEGORIES = [
  'Varios', 
  'Comida', 
  'Transporte', 
  'Hogar', 
  'Ocio', 
  'Educación',
  'Salud', 
  'Suscripciones', 
  'Compras'
];

export const BASE_INCOME_CATEGORIES = [
  'Varios', 
  'Ingreso Extra', 
  'Nómina'
];
