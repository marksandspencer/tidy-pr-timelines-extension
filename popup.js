const getAllPhrases = () => {
  return PHRASES_TO_HIDE.map((e) => `<h6>*${e}*</h6>`).join(" ");
}

document.getElementById("filterData").innerHTML = getAllPhrases();
