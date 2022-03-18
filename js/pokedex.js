$("document").ready(function () {
  const searchInput = $("#search");

  getPokemonList(searchInput);

  searchInput.keypress(async (e) => {
    if (e.keyCode == "13") {
      const pokemon = await getPokemon(searchInput.val());

      displayInfo(pokemon);
      speakInfo(pokemon.name, pokemon.species, pokemon.biology);
    }
  })
})

const speakInfo = (name = "", species = "Especie desconocida", biology = "") => {
  const textToSpeech = name
    .concat(". ")
    .concat(species)
    .concat(". ")
    .concat(biology)

  responsiveVoice.cancel(); //Cancela cualquier sonido en proceso
  responsiveVoice.speak(textToSpeech, "Spanish Latin American Male");
}

const displayInfo = (pokemon) => {
  const speciesField = $("#species .desc");
  const typeField = $("#type .desc");
  const heightField = $("#height .desc");
  const weightField = $("#weight .desc");
  const movements = $("#movements .desc");
  const evolutionField = $("#evolution .desc");
  const biologyField = $("#bio .desc");
  const imageField = $("#display .pokemon-image");

  const defaultImage = './img/de';
  const defaultText = '...';
  const {
    species = defaultText,
    type = defaultText,
    height = defaultText,
    weight = defaultText,
    movement = defaultText,
    evolution = defaultText,
    biology = defaultText,
    imageUrl = defaultImage
  } = pokemon;

  speciesField.text(species);
  typeField.text(type);
  heightField.text(height);
  weightField.text(weight);
  evolutionField.text(evolution);
  biologyField.text(biology);
  imageField.css("background-image", `url(${imageUrl}`);
  imageField.css("background-color", `#FFFFF`);
}

const displaySearchMessage = (value = true) => {
  const mainScreen = $("#display");

  if (value) {
    mainScreen.addClass("is-searching");
  } else {
    mainScreen.removeClass("is-searching");
  }
}

const displayNotFoundMessage = (value = true) => {
  const mainScreen = $("#display");

  if (value) {
    mainScreen.addClass("is-not-found");
  } else {
    mainScreen.removeClass("is-not-found");
  }
}

const getPokemon = async (text) => {
  const searchTerm = getSearchTerm(text);
  console.log("El dato del pokemon es:", searchTerm)

  if (Boolean(searchTerm) === false) {
    return {};
  }
  // Escondemos cualquier 404 previo a cualquier busqueda
  displayNotFoundMessage(false); 
  displaySearchMessage();

  const generalInfo = await getGeneralInfo(searchTerm);

  // En caso de Pokemon no encontrado
  if (Boolean(generalInfo) === false) {
    displaySearchMessage(false);
    displayNotFoundMessage();
    return {}
  }

  const speciesInfo = await getSpeciesInfo(generalInfo.species.url);
  const evolutionInfo = await getEvolutionInfo(speciesInfo.evolution_chain?.url, generalInfo.name);

  const pokemon = {
    name: getName(generalInfo.name),
    species: getSpecies(speciesInfo.genera),
    type: getType(generalInfo.types),
    height: getHeight(generalInfo.height),
    weight: getWeight(generalInfo.weight),
    evolution: getEvolution(evolutionInfo),
    biology: getBiology(speciesInfo.flavor_text_entries),
    moves: getMovements(generalInfo.moves),
    imageUrl: getImageUrl(generalInfo.name)
  }

  displaySearchMessage(false);

  return pokemon;
}

const getGeneralInfo = async (searchTerm) => {
  const url = `https://pokeapi.co/api/v2/pokemon/${searchTerm}`;

  try {
    const response = await axios.get(url);
    console.log("La data del pokemon es: ", response.data);
    return response.data
  } catch {
    return null
  }
}

const getSpeciesInfo = async (url) => {
  const response = await axios.get(url);
  return response.data;
}

const getEvolutionInfo = async (url, name) => {
  if (Boolean(url) === false) {
    return {
      species: { name: name },
      evolves_to: []
    }
  }
  const response = await axios.get(url);
  return response.data.chain;
}

// En esta seccion obtenemos una lista de aproximados 893 alternativas
const getPokemonList = async (searchInput) => {
  const url = "https://pokeapi.co/api/v2/pokemon/?limit=893";
  const response = await axios.get(url);
  const list = response.data.results.map((pokemon, id) =>
    getDropDownOption(pokemon.name, id + 1)
  );
  // Ayudamos con el autocompletado
  searchInput.autocomplete({
    autoFocus: true,
    source: list,
    minLength: 2,
    select: (e, ui) => {
      searchInput.val(ui.item.value);
      searchInput.trigger({ type: 'keypress', keyCode: 13 });
    }
  });
}

// Generamos la funcion para desplazarnos
const getDropDownOption = (name, id) => {
  const formattedID = appendLeadingZero(id);
  const formattedName = capitalizeFirstLetter(name);

  return `${formattedID} - ${formattedName}`
}

const getName = (name) => {
  return capitalizeFirstLetter(name);
}

const getSpecies = (array) => {
  return array.filter(text => text.language.name == "es")[0]?.genus;
}

const getType = (array) => {
  const type = array
    .map(currentType => capitalizeFirstLetter(currentType.type.name))
    .join("\\");
  return type;
}

const getHeight = (height) => {
  return `${height / 10} m`;
}

const getWeight = (weight) => {
  return `${weight / 10} kg`;
}

const getBiology = (array) => {
  const biologyList = array.filter(text => text.language.name == "es");
  const biology = biologyList[biologyList.length - 1].flavor_text;
  return biology;
}

const getMovements = (array) => {
  // const type = array
  //   .map(currentType => capitalizeFirstLetter(currentType.moves.move))
  //   .join("\\");
  // return type;
}

// Obtenemos la imagen de una fuente distina
const getImageUrl = (name) => {
  return `https://img.pokemondb.net/artwork/large/${name}.jpg`;
}

const getSearchTerm = (searchTerm) => {
  if (parseInt(searchTerm)) {
    return parseInt(searchTerm).toString()
  }
  return searchTerm;
}

const getEvolution = (obj) => {
  const chain = obj;
  const evolution_1 = capitalizeFirstLetter(chain.species.name);
  const evolution_2 = [];
  const evolution_3 = [];

  chain.evolves_to.forEach(chain_2 => {
    evolution_2.push(capitalizeFirstLetter(chain_2.species.name));

    chain_2.evolves_to.forEach(chain_3 => {
      evolution_3.push(capitalizeFirstLetter(chain_3.species.name));
    });
  });

  if (evolution_2.length === 0) {
    return `${evolution_1}`
  } else if (evolution_3.length === 0) {
    return `${evolution_1} > ${evolution_2.join(", ")}`
  }

  return `${evolution_1} > ${evolution_2.join(", ")} > ${evolution_3.join(", ")}`
}

const appendLeadingZero = (num) => {
  switch (num.toString().length) {
    case 1:
      return "000" + num;
    case 2:
      return "00" + num;
    case 3:
      return "0" + num;
    default:
      return num
  }
}

const capitalizeFirstLetter = (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
}