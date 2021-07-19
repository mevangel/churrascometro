let inputAdultos = document.getElementById("adultos");
let inputCriancas = document.getElementById("criancas");
let inputHoras = document.getElementById("horas");

let resultado = document.getElementById("resultado");

function calcular() {
    

    let adultos = inputAdultos.value;
    let criancas = inputCriancas.value;
    let horas = inputHoras.value;


    let qtdeCarne = carnePP(horas) * adultos + (carnePP(horas)*criancas)/2;
    let qtdeCerveja = cervejaPP(horas) * adultos;
    let qtdeBebida = bebidasPP(horas) * adultos + (bebidasPP(horas)*criancas)/2;

    resultado.innerHTML += `<p> - ${qtdeCarne}g de Carne </p>`
    resultado.innerHTML += `<p> - ${qtdeCerveja}ml de Cerveja</p>`
    resultado.innerHTML += `<p> - ${qtdeBebida}ml de Bebida sem alcool</p>`

    }

function carnePP(horas){
    if(horas>6){
    return 650;
    }
    else{
    return 400;
    }
}

function cervejaPP(horas){
    if(horas>6){
    return 650;
    }
    else{
    return 400;
    }
}

function bebidasPP(horas){
    if(horas>6){
    return 1500;
    }
    else{
    return 1000;
    }
}



