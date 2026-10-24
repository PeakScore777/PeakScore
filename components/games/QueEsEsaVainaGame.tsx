"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Clock3, Lightbulb, RotateCcw, Sparkles, Trophy, XCircle } from "lucide-react";

type Subject = "Matemáticas" | "Química" | "Física" | "Biología" | "Historia" | "Inglés";
type Question = { id: string; subject: Subject; topic: string; clue: string; options: string[]; answer: number; explanation: string; hint: string };

const QUESTION_BANK: Question[] = [
  { id:"mid-m6",subject:"Matemáticas",topic:"Porcentajes y variación",clue:"Una tienda aumenta un artículo un 20 % y luego ofrece un descuento del 20 % sobre el nuevo precio. Si al inicio costaba $100.000, ¿cuánto cuesta al final?",options:["$100.000","$96.000","$98.000","$80.000"],answer:1,explanation:"Primero aumenta a $120.000. El descuento es el 20 % de $120.000, es decir $24.000. El precio final es $96.000; porcentajes sucesivos no se cancelan porque se calculan sobre bases distintas.",hint:"Calcula cada porcentaje sobre el precio que existe en ese paso."},
  { id:"hard-m7",subject:"Matemáticas",topic:"Interpretación de datos · reto ICFES",clue:"En una encuesta, 40 estudiantes prefieren ciencias, 30 prefieren arte y 10 prefieren ambas. Si cada estudiante eligió al menos una de las dos, ¿cuántos estudiantes participaron?",options:["60","70","80","90"],answer:0,explanation:"Al sumar 40 + 30, los 10 estudiantes que eligieron ambas áreas se cuentan dos veces. Se resta una vez la intersección: 40 + 30 − 10 = 60 estudiantes.",hint:"Al sumar dos grupos que se superponen, resta una vez a quienes pertenecen a ambos."},
  { id:"hard-q5",subject:"Química",topic:"Mezclas y métodos de separación · reto ICFES",clue:"Una muestra contiene limaduras de hierro, arena y sal disuelta en agua. ¿Qué secuencia permite recuperar por separado el hierro, la arena y la sal sólida?",options:["Filtración, imantación y decantación","Imantación, filtración y evaporación","Evaporación, cromatografía y fusión","Destilación, electrólisis y tamizado"],answer:1,explanation:"La imantación retira el hierro; la filtración separa la arena insoluble de la disolución salina; finalmente, la evaporación elimina el agua y permite recuperar la sal sólida.",hint:"Usa primero una propiedad magnética, después la insolubilidad y al final la evaporación del agua."},
  { id:"hard-f5",subject:"Física",topic:"Movimiento y rapidez media · reto ICFES",clue:"Un ciclista recorre 12 km en 30 minutos y luego 8 km en 20 minutos. ¿Cuál es su rapidez media durante todo el trayecto?",options:["20 km/h","24 km/h","40 km/h","48 km/h"],answer:1,explanation:"La distancia total es 20 km y el tiempo total es 50 minutos, equivalente a 5/6 de hora. La rapidez media es 20 ÷ (5/6) = 24 km/h.",hint:"Rapidez media = distancia total dividida entre tiempo total; convierte minutos a horas."},
  { id:"mid-b5",subject:"Biología",topic:"Transporte a través de membrana",clue:"Una célula se coloca en una solución más concentrada que su interior. Si la membrana permite el paso del agua, ¿qué cambio se espera inicialmente?",options:["El agua entra y la célula aumenta de volumen","El agua sale y la célula pierde volumen","La sal entra siempre por difusión simple","No hay movimiento neto de agua"],answer:1,explanation:"En un medio hipertónico, el agua tiende a salir de la célula por ósmosis, por lo que el volumen celular disminuye.",hint:"Compara la concentración de solutos fuera y dentro de la célula."},
  { id:"mid-h5",subject:"Historia",topic:"Análisis de fuentes históricas",clue:"Dos cartas de testigos describen de forma distinta una protesta. ¿Cuál es la mejor estrategia para construir una explicación histórica?",options:["Elegir la carta más extensa y descartar la otra","Aceptar la carta más antigua como necesariamente verdadera","Contrastar ambas con su contexto y otras evidencias","Promediar literalmente las dos versiones"],answer:2,explanation:"Las fuentes tienen perspectivas, intereses y límites. El análisis histórico contrasta testimonios con el contexto y otras evidencias, en lugar de asumir que una sola fuente es totalmente neutral.",hint:"La calidad de una explicación aumenta al contrastar evidencias y reconocer perspectivas."},
  { id:"hard-e5",subject:"Inglés",topic:"Connectors and inference · reto ICFES",clue:"Read: “Maya studied the instructions carefully; however, she still made a mistake.” What does “however” signal?",options:["A cause","A contrast","A sequence","A conclusion"],answer:1,explanation:"“However” introduces contrast: despite studying carefully, Maya made a mistake.",hint:"The second idea contrasts with what the reader might expect from the first."},
  { id:"m1",subject:"Matemáticas",topic:"Porcentajes",clue:"En una tienda, una mochila cuesta $80.000 y tiene un descuento del 25 %. ¿Qué operación permite calcular el descuento?",options:["80.000 ÷ 25","80.000 × 0,25","80.000 + 0,25","25 ÷ 0,25"],answer:1,explanation:"El 25 % equivale a 0,25. Multiplicar 80.000 por 0,25 da un descuento de $20.000; el precio final sería $60.000.",hint:"Convierte el porcentaje en un número decimal antes de operar."},
  { id:"m2",subject:"Matemáticas",topic:"Ecuaciones básicas",clue:"Un número multiplicado por 3 y luego aumentado en 4 da 19. ¿Qué número es?",options:["3","4","5","7"],answer:2,explanation:"La situación se representa con 3x + 4 = 19. Restamos 4: 3x = 15. Dividimos entre 3: x = 5.",hint:"Deshaz las operaciones en orden inverso: primero resta 4 y luego divide entre 3."},
  { id:"m3",subject:"Matemáticas",topic:"Medidas de tendencia central",clue:"Las notas de cuatro actividades son 3, 4, 4 y 5. ¿Cuál es la mediana?",options:["3","3,5","4","4,5"],answer:2,explanation:"Los datos ya están ordenados. Como hay cuatro valores, la mediana es el promedio de los dos centrales: (4 + 4) / 2 = 4.",hint:"Con una cantidad par de datos, promedia los dos valores del centro."},
  { id:"m4",subject:"Matemáticas",topic:"Plano cartesiano",clue:"Un punto se ubica en (−2, 3). ¿En qué cuadrante del plano cartesiano está?",options:["I","II","III","IV"],answer:1,explanation:"En el segundo cuadrante la coordenada x es negativa y la coordenada y es positiva. El punto (−2, 3) cumple esas condiciones.",hint:"Mira primero el signo de x y después el de y."},
  { id:"q1",subject:"Química",topic:"Materia y sus propiedades",clue:"Un estudiante mezcla arena con agua. Después de agitar, puede distinguir los dos componentes y separarlos por filtración. ¿Cómo se clasifica la mezcla?",options:["Sustancia pura","Mezcla heterogénea","Elemento químico","Compuesto puro"],answer:1,explanation:"En una mezcla heterogénea los componentes no se distribuyen uniformemente y pueden distinguirse o separarse mediante métodos físicos, como la filtración.",hint:"Pregúntate si la composición es uniforme en toda la muestra."},
  { id:"q2",subject:"Química",topic:"Escalas de temperatura",clue:"Una muestra pasa de 20 °C a 35 °C. ¿Cuánto aumentó su temperatura?",options:["15 °C","20 °C","35 °C","55 °C"],answer:0,explanation:"El cambio de temperatura es la diferencia entre el valor final y el inicial: 35 − 20 = 15 °C.",hint:"Calcula temperatura final menos temperatura inicial."},
  { id:"q3",subject:"Química",topic:"Átomo y sus características",clue:"¿Qué partícula subatómica tiene carga eléctrica negativa?",options:["Protón","Neutrón","Electrón","Núcleo"],answer:2,explanation:"El electrón tiene carga negativa; el protón tiene carga positiva y el neutrón no tiene carga eléctrica neta.",hint:"Es la partícula que se encuentra alrededor del núcleo en el modelo escolar del átomo."},
  { id:"q4",subject:"Química",topic:"Tipos de reacciones y pH",clue:"Una solución tiene pH 3. Si se compara con una solución de pH 8, ¿cuál afirmación es correcta?",options:["La de pH 3 es más ácida","La de pH 3 es más básica","Ambas son neutras","El pH no informa sobre acidez"],answer:0,explanation:"En la escala habitual, un pH menor que 7 indica acidez y un pH mayor que 7 indica basicidad. Por eso, pH 3 es más ácido que pH 8.",hint:"En la escala de pH, los valores por debajo de 7 son ácidos."},
  { id:"f1",subject:"Física",topic:"Cinemática",clue:"Una ciclista recorre 120 metros en 20 segundos a rapidez constante. ¿Cuál es su rapidez media?",options:["2 m/s","4 m/s","6 m/s","12 m/s"],answer:2,explanation:"La rapidez media es distancia dividida entre tiempo: 120 m ÷ 20 s = 6 m/s.",hint:"Usa rapidez = distancia / tiempo."},
  { id:"f2",subject:"Física",topic:"Dinámica",clue:"Un carrito recibe un empujón y acelera. Según la segunda ley de Newton, si la masa permanece igual y la fuerza neta aumenta, ¿qué ocurre con la aceleración?",options:["Disminuye","Aumenta","Permanece siempre en cero","Se convierte en masa"],answer:1,explanation:"La segunda ley de Newton establece que la fuerza neta es igual a masa por aceleración (F = ma). Para una masa constante, una fuerza neta mayor produce una aceleración mayor.",hint:"Recuerda la relación F = m × a."},
  { id:"f3",subject:"Física",topic:"Movimiento ondulatorio",clue:"En una onda, ¿cómo se llama la distancia entre dos crestas consecutivas?",options:["Amplitud","Frecuencia","Longitud de onda","Período"],answer:2,explanation:"La longitud de onda es la distancia entre dos puntos consecutivos que están en la misma fase, por ejemplo, dos crestas.",hint:"Se representa con la letra griega lambda (λ)."},
  { id:"b1",subject:"Biología",topic:"Célula procariota vs. eucariota",clue:"Una célula observada al microscopio tiene ADN en una región sin membrana nuclear. ¿A qué tipo corresponde?",options:["Eucariota","Procariota","Célula muscular","Ninguna célula"],answer:1,explanation:"Las células procariotas no tienen núcleo delimitado por membrana. En las eucariotas, el ADN se encuentra principalmente dentro de un núcleo.",hint:"La clave es si el material genético está encerrado en un núcleo."},
  { id:"b2",subject:"Biología",topic:"Transporte de membrana",clue:"Una gota de colorante se dispersa en un vaso con agua sin que se agite. Las partículas se mueven desde la zona más concentrada hacia zonas menos concentradas. ¿Qué proceso describe?",options:["Difusión","Fotosíntesis","Mitosis","Digestión"],answer:0,explanation:"La difusión es el movimiento neto de partículas desde una región de mayor concentración hacia otra de menor concentración, debido a su movimiento aleatorio.",hint:"Es un tipo de transporte pasivo."},
  { id:"b3",subject:"Biología",topic:"Ecosistemas",clue:"En una cadena alimentaria, el pasto recibe energía de la luz solar y produce materia orgánica. ¿Qué papel cumple?",options:["Consumidor secundario","Descomponedor","Productor","Depredador tope"],answer:2,explanation:"Las plantas son productores porque elaboran materia orgánica a partir de sustancias inorgánicas usando energía luminosa mediante la fotosíntesis.",hint:"Piensa en el organismo que inicia muchas cadenas alimentarias."},
  { id:"b4",subject:"Biología",topic:"Genética mendeliana",clue:"En una planta, el alelo A domina sobre a. Si se cruza Aa × aa, ¿qué proporción de descendientes se espera que tenga genotipo Aa?",options:["0 %","25 %","50 %","100 %"],answer:2,explanation:"El primer progenitor puede aportar A o a; el segundo solo puede aportar a. La mitad de combinaciones son Aa y la otra mitad aa.",hint:"Escribe las dos posibilidades del primer progenitor: A y a."},
  { id:"h1",subject:"Historia",topic:"Historia de Colombia",clue:"Una fuente histórica es una carta escrita por una persona que participó en un acontecimiento. ¿Por qué puede ser útil para estudiar ese hecho?",options:["Porque nunca contiene sesgos","Porque aporta un testimonio que debe contextualizarse","Porque reemplaza todas las demás fuentes","Porque siempre es más exacta que una cifra"],answer:1,explanation:"Una fuente primaria puede aportar información directa sobre una época, pero debe analizarse teniendo en cuenta quién la produjo, cuándo, con qué propósito y qué perspectiva presenta.",hint:"Una fuente es valiosa, pero también debe evaluarse críticamente."},
  { id:"h2",subject:"Historia",topic:"Modelos económicos",clue:"Un gobierno decide que ciertos servicios esenciales sean financiados y administrados principalmente por el Estado. ¿Qué aspecto del modelo económico está definiendo?",options:["La organización del papel estatal en la economía","La ubicación de los continentes","La composición de un átomo","La duración de una onda"],answer:0,explanation:"Los modelos económicos se diferencian, entre otros aspectos, por el papel que asignan al Estado, al mercado y a los agentes privados en la producción y distribución.",hint:"La pista está en quién financia y administra los servicios."},
  { id:"e1",subject:"Inglés",topic:"Present simple",clue:"Choose the correct option: “My sister ___ to school by bus every day.”",options:["go","goes","going","gone"],answer:1,explanation:"In the present simple, a third-person singular subject (he, she, it) usually takes a verb ending in -s or -es. Therefore, “goes” is correct.",hint:"“My sister” is third-person singular."},
  { id:"e2",subject:"Inglés",topic:"Connectors",clue:"Choose the best connector: “It was raining, ___ we stayed at home.”",options:["because","but","so","although"],answer:2,explanation:"“So” introduces a result. It was raining; as a result, we stayed at home.",hint:"Choose the word that introduces a consequence."},
  { id:"e3",subject:"Inglés",topic:"Past simple",clue:"Choose the correct sentence about yesterday.",options:["They visit the museum yesterday.","They visited the museum yesterday.","They visiting the museum yesterday.","They visits the museum yesterday."],answer:1,explanation:"The sentence refers to a finished action in the past. For the regular verb “visit”, the past simple form is “visited”.",hint:"Look for the regular past-tense ending -ed."},
  { id:"m5",subject:"Matemáticas",topic:"Teorema de Pitágoras",clue:"Un triángulo rectángulo tiene catetos de 6 cm y 8 cm. ¿Cuánto mide la hipotenusa?",options:["7 cm","10 cm","12 cm","14 cm"],answer:1,explanation:"Por el teorema de Pitágoras, c² = 6² + 8² = 36 + 64 = 100. Entonces c = 10 cm.",hint:"Eleva ambos catetos al cuadrado, suma y saca la raíz cuadrada."},,

  { id:"bank-031",subject:"Matemáticas",topic:"Ecuación lineal",clue:"Un servicio cobra una tarifa fija de $4.000 y $1.500 por cada hora. Si la cuenta fue de $10.000, ¿cuántas horas se usaron?",options:["3","4","5","6"],answer:2,explanation:"Se resta la tarifa fija: 10.000 − 4.000 = 6.000. Luego 6.000 ÷ 1.500 = 4 horas. La respuesta correcta es 4.",hint:"Resta primero la tarifa fija y divide el resto por el costo de cada hora."},
  { id:"bank-032",subject:"Matemáticas",topic:"Media aritmética",clue:"Una estudiante obtuvo 3,0; 4,0 y 5,0 en tres pruebas con el mismo peso. ¿Cuál es su promedio?",options:["3,5","4,0","4,5","12,0"],answer:1,explanation:"La media es la suma dividida entre la cantidad de datos: (3 + 4 + 5) ÷ 3 = 4.",hint:"Suma las tres notas y divide entre tres."},
  { id:"bank-033",subject:"Matemáticas",topic:"Proporcionalidad",clue:"Cuatro cuadernos iguales cuestan $18.000. Si el precio por cuaderno no cambia, ¿cuánto cuestan seis?",options:["$22.000","$24.000","$27.000","$30.000"],answer:2,explanation:"Cada cuaderno cuesta 18.000 ÷ 4 = 4.500. Seis cuestan 6 × 4.500 = 27.000.",hint:"Encuentra primero el precio de un cuaderno."},
  { id:"bank-034",subject:"Matemáticas",topic:"Área de triángulo",clue:"Un terreno triangular tiene base de 12 m y altura perpendicular de 7 m. ¿Cuál es su área?",options:["19 m²","42 m²","84 m²","168 m²"],answer:1,explanation:"El área de un triángulo es base por altura dividido entre dos: 12 × 7 ÷ 2 = 42 m².",hint:"Recuerda dividir entre dos el producto de base y altura."},
  { id:"bank-035",subject:"Matemáticas",topic:"Probabilidad",clue:"En una bolsa hay 3 fichas rojas y 5 azules. Se extrae una al azar. ¿Cuál es la probabilidad de que sea roja?",options:["3/5","5/8","3/8","1/3"],answer:2,explanation:"Hay 8 fichas en total y 3 favorables al evento rojo, así que la probabilidad es 3/8.",hint:"Casos favorables sobre el total de casos posibles."},
  { id:"bank-036",subject:"Matemáticas",topic:"Pendiente de una recta",clue:"Una recta pasa por (1, 2) y (4, 8). ¿Cuál es su pendiente?",options:["2","3","6","10"],answer:0,explanation:"La pendiente es el cambio vertical dividido entre el horizontal: (8 − 2)/(4 − 1) = 6/3 = 2.",hint:"Resta las coordenadas y de los puntos y divide entre la resta de las x."},
  { id:"bank-037",subject:"Matemáticas",topic:"Teorema de Pitágoras",clue:"Una escalera llega a una ventana a 12 m de altura y su base está a 5 m del muro. ¿Cuánto mide la escalera?",options:["13 m","15 m","17 m","7 m"],answer:0,explanation:"La escalera es la hipotenusa: √(12² + 5²) = √169 = 13 m.",hint:"Los 12 m y 5 m son los catetos del triángulo rectángulo."},
  { id:"bank-038",subject:"Química",topic:"Separación de mezclas",clue:"Se mezclan limaduras de hierro con arena. ¿Qué método permite separar el hierro de forma directa?",options:["Destilación","Imantación","Filtración","Cromatografía"],answer:1,explanation:"El hierro es atraído por un imán y la arena no, por lo que la imantación permite separarlos.",hint:"Aprovecha una propiedad magnética de uno de los componentes."},
  { id:"bank-039",subject:"Química",topic:"Cambios físicos",clue:"Un cubo de hielo se derrite en un vaso. ¿Qué afirmación describe mejor el proceso?",options:["Se forma una sustancia nueva","El agua cambia de estado","Los átomos se convierten en otros elementos","Ocurre necesariamente una reacción química"],answer:1,explanation:"La fusión es un cambio físico: el agua pasa de sólido a líquido sin cambiar su identidad química.",hint:"Piensa si la sustancia sigue siendo agua después del cambio."},
  { id:"bank-040",subject:"Química",topic:"pH",clue:"Una solución tiene pH 2 y otra pH 5. A temperatura comparable, ¿cuál es más ácida?",options:["La de pH 5","La de pH 2","Ambas son neutras","No se puede comparar"],answer:1,explanation:"Un pH menor indica mayor acidez. La escala es logarítmica; pH 2 corresponde a mayor concentración de iones hidrógeno que pH 5.",hint:"En la escala de pH, los valores más bajos indican mayor acidez."},
  { id:"bank-041",subject:"Química",topic:"Estructura atómica",clue:"Un átomo neutro tiene 11 protones y 11 electrones. Si pierde un electrón, ¿qué ocurre?",options:["Se convierte en un anión","Se convierte en un catión +1","Su número de protones baja a 10","Se vuelve eléctricamente neutro con carga −1"],answer:1,explanation:"Al perder una carga negativa quedan 11 protones y 10 electrones, con carga neta +1: un catión.",hint:"Compara la cantidad de cargas positivas y negativas después de perder el electrón."},
  { id:"bank-042",subject:"Química",topic:"Conservación de la masa",clue:"En un sistema cerrado ocurre una reacción química. Según la ley de conservación de la masa, ¿qué sucede?",options:["La masa total aumenta siempre","La masa total disminuye siempre","La masa total de reactivos y productos es igual","Los productos no tienen masa"],answer:2,explanation:"En un sistema cerrado, la materia se reorganiza durante la reacción, pero la masa total se conserva.",hint:"Los átomos se reorganizan; no desaparecen por una reacción química ordinaria."},
  { id:"bank-043",subject:"Química",topic:"Concentración",clue:"Se disuelven 10 g de sal hasta obtener 200 mL de solución. ¿Cuál es la concentración masa/volumen en g/L?",options:["5 g/L","20 g/L","50 g/L","2000 g/L"],answer:2,explanation:"200 mL equivalen a 0,2 L. La concentración es 10 g ÷ 0,2 L = 50 g/L.",hint:"Convierte los mililitros a litros antes de dividir la masa."},
  { id:"bank-044",subject:"Física",topic:"Rapidez media",clue:"Un ciclista recorre 36 km en 2 horas a lo largo de una ruta. ¿Cuál es su rapidez media?",options:["12 km/h","18 km/h","34 km/h","72 km/h"],answer:1,explanation:"Rapidez media = distancia total / tiempo total = 36/2 = 18 km/h.",hint:"Divide la distancia recorrida entre el tiempo transcurrido."},
  { id:"bank-045",subject:"Física",topic:"Segunda ley de Newton",clue:"Una fuerza neta de 12 N actúa sobre un objeto de masa 3 kg. ¿Cuál es su aceleración?",options:["4 m/s²","9 m/s²","15 m/s²","36 m/s²"],answer:0,explanation:"Por F = ma, la aceleración es a = F/m = 12/3 = 4 m/s².",hint:"Despeja la aceleración dividiendo la fuerza neta entre la masa."},
  { id:"bank-046",subject:"Física",topic:"Densidad",clue:"Un bloque tiene masa de 240 g y volumen de 80 cm³. ¿Cuál es su densidad?",options:["0,3 g/cm³","2 g/cm³","3 g/cm³","160 g/cm³"],answer:2,explanation:"La densidad es masa/volumen: 240 g ÷ 80 cm³ = 3 g/cm³.",hint:"Divide la masa entre el volumen, no al contrario."},
  { id:"bank-047",subject:"Física",topic:"Circuitos eléctricos",clue:"Una resistencia de 6 Ω se conecta a una fuente de 12 V. Si se comporta de forma óhmica, ¿qué corriente circula?",options:["0,5 A","2 A","6 A","72 A"],answer:1,explanation:"La ley de Ohm establece V = IR; por tanto I = V/R = 12/6 = 2 A.",hint:"Divide el voltaje entre la resistencia."},
  { id:"bank-048",subject:"Física",topic:"Ondas",clue:"Una onda tiene frecuencia de 5 Hz y longitud de onda de 2 m. ¿Cuál es su rapidez?",options:["2,5 m/s","7 m/s","10 m/s","20 m/s"],answer:2,explanation:"La rapidez de onda se calcula con v = frecuencia × longitud de onda = 5 × 2 = 10 m/s.",hint:"Multiplica la frecuencia por la longitud de onda."},
  { id:"bank-049",subject:"Física",topic:"Energía potencial gravitatoria",clue:"Un objeto de 2 kg se eleva 3 m. Usa g = 10 m/s². ¿Cuánto aumenta su energía potencial gravitatoria?",options:["6 J","15 J","60 J","600 J"],answer:2,explanation:"El aumento es mgh = 2 × 10 × 3 = 60 J.",hint:"Multiplica masa, gravedad y cambio de altura."},
  { id:"bank-050",subject:"Física",topic:"Presión",clue:"Una fuerza de 100 N se distribuye uniformemente sobre un área de 2 m². ¿Qué presión ejerce?",options:["50 Pa","98 Pa","102 Pa","200 Pa"],answer:0,explanation:"La presión es fuerza dividida entre área: 100 N / 2 m² = 50 Pa.",hint:"Presión = fuerza perpendicular / área."},
  { id:"bank-051",subject:"Biología",topic:"Fotosíntesis",clue:"Una planta se mantiene con luz, agua y dióxido de carbono. ¿Qué proceso utiliza para almacenar energía química en moléculas orgánicas?",options:["Fermentación láctica","Fotosíntesis","Difusión simple","Meiosis"],answer:1,explanation:"Durante la fotosíntesis, la energía luminosa impulsa la formación de moléculas orgánicas a partir de CO₂ y agua.",hint:"Es el proceso asociado a los cloroplastos y a la energía de la luz."},
  { id:"bank-052",subject:"Biología",topic:"Mitosis",clue:"Una célula somática humana realiza mitosis y completa la división celular sin errores. ¿Cuántos cromosomas tendrá cada célula hija?",options:["23","46","92","Depende del tamaño de la célula"],answer:1,explanation:"La mitosis conserva el número de cromosomas: cada célula hija humana somática recibe 46 cromosomas.",hint:"La mitosis conserva la información cromosómica de la célula original."},
  { id:"bank-053",subject:"Biología",topic:"Membrana celular",clue:"Una célula se coloca en una solución más concentrada que su interior. Si la membrana permite el paso del agua, ¿qué tendencia se espera?",options:["El agua entra y la célula se hincha","El agua sale y la célula pierde volumen","No hay movimiento neto de agua en ningún caso","La membrana desaparece"],answer:1,explanation:"En un medio hipertónico, el agua tiende a salir de la célula por ósmosis, lo que puede reducir su volumen.",hint:"El agua se desplaza hacia el medio con mayor concentración efectiva de solutos."},
  { id:"bank-054",subject:"Biología",topic:"Selección natural",clue:"En una población de insectos, algunos resisten un pesticida y sobreviven más. Tras varias generaciones aumenta la proporción resistente. ¿Cuál es la mejor explicación?",options:["Cada insecto decidió adaptarse","El pesticida produjo necesariamente la misma mutación en todos","Los resistentes dejaron más descendencia en ese ambiente","Todos los insectos se volvieron idénticos"],answer:2,explanation:"Si la resistencia heredable mejora la supervivencia y reproducción bajo esa presión, la variante puede aumentar en frecuencia por selección natural.",hint:"Considera qué individuos sobreviven y dejan más descendencia."},
  { id:"bank-055",subject:"Biología",topic:"Redes tróficas",clue:"Si disminuye drásticamente la población de un depredador, ¿qué efecto es posible en sus presas?",options:["Siempre desaparecen inmediatamente","Su población puede aumentar si otros factores no lo limitan","Dejan de necesitar energía","Se convierten en productores"],answer:1,explanation:"Al reducirse la depredación, las presas pueden aumentar, aunque el resultado depende de alimento, enfermedades y otros factores del ecosistema.",hint:"Menos depredación puede aumentar la supervivencia de las presas, pero no es el único factor."},
  { id:"bank-056",subject:"Biología",topic:"Genética mendeliana",clue:"En una especie, A domina sobre a. Se cruzan dos individuos Aa. ¿Qué proporción genotípica se espera en la descendencia?",options:["100 % AA","1 AA : 2 Aa : 1 aa","3 AA : 1 aa","1 Aa : 1 aa"],answer:1,explanation:"El cruce Aa × Aa produce AA, Aa, Aa y aa; la proporción genotípica esperada es 1:2:1.",hint:"Escribe las combinaciones posibles de los gametos A y a de ambos progenitores."},
  { id:"bank-057",subject:"Historia",topic:"Fuentes históricas",clue:"Para investigar las condiciones laborales en una fábrica en 1920, ¿cuál sería una fuente primaria especialmente útil?",options:["Una novela publicada en 2020 sobre fábricas","Un registro de nómina de esa fábrica fechado en 1920","Un resumen escolar actual sin referencias","Una película contemporánea de ficción"],answer:1,explanation:"Una nómina producida en la época es una fuente primaria directa sobre registros laborales, aunque debe contrastarse y analizarse críticamente.",hint:"Busca un documento creado durante el periodo que investigas."},
  { id:"bank-058",subject:"Historia",topic:"Causalidad histórica",clue:"Una investigación afirma que una crisis económica tuvo una sola causa porque ocurrió después de una sequía. ¿Cuál es la crítica más sólida?",options:["La secuencia temporal prueba causalidad","La sequía nunca afecta a la economía","Debe examinar otras causas y evidencias antes de concluir causalidad","Los hechos históricos no pueden investigarse"],answer:2,explanation:"Que un hecho preceda a otro no demuestra por sí solo causalidad; es necesario evaluar mecanismos, evidencia y explicaciones alternativas.",hint:"Distingue entre que dos hechos ocurran en secuencia y demostrar que uno causó el otro."},
  { id:"bank-059",subject:"Historia",topic:"Industrialización",clue:"Una región pasa de producir principalmente en talleres pequeños a fabricar bienes en grandes fábricas con maquinaria. ¿Qué proceso describe mejor este cambio?",options:["Industrialización","Feudalización","Descolonización","Nomadismo"],answer:0,explanation:"La industrialización implica expandir la producción mecanizada y fabril, con cambios en el trabajo, la economía y la urbanización.",hint:"Piensa en el paso de la producción artesanal a la producción mecanizada."},
  { id:"bank-060",subject:"Inglés",topic:"Present simple",clue:"Choose the correct sentence: “My brother ___ football every Saturday.”",options:["play","plays","playing","is play"],answer:1,explanation:"In the present simple, a third-person singular subject (he/she/it) takes -s or -es: “My brother plays football every Saturday.”",hint:"“My brother” is third-person singular."},
];

const TOTAL_ROUNDS = 10;
const STORAGE_KEY = "peakscore-que-es-esa-vaina-v1";

type SavedProgress = { bestScore: number; completedIds: string[]; chests: number };

function getRoundsFromPool(source: Question[]): Question[] {
  const pool = [...source];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, TOTAL_ROUNDS);
}

function getRounds(): Question[] {
  return getRoundsFromPool(QUESTION_BANK);
}

export default function QueEsEsaVainaGame() {
  const [rounds, setRounds] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState<SavedProgress>({ bestScore: 0, completedIds: [], chests: 0 });
  const [hydrated, setHydrated] = useState(false);
  const [accountProgress, setAccountProgress] = useState<{ best_score: number; best_correct: number; games_completed: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedProgress>;
        setSaved({
          bestScore: Math.max(0, Number(parsed.bestScore) || 0),
          completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds.filter((id): id is string => typeof id === "string") : [],
          chests: Math.max(0, Number(parsed.chests) || 0),
        });
      }
    } catch {
      // El juego continúa sin progreso guardado si el almacenamiento está bloqueado.
    }
    let active = true;
    void fetch("/api/games/questions", { method: "GET", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return [];
        const payload = await response.json();
        return Array.isArray(payload?.questions) ? payload.questions : [];
      })
      .then((published: Array<Partial<Question> & { id: string }>) => {
        if (!active) return;
        const valid = published.filter((q) =>
          typeof q.id === "string" &&
          typeof q.subject === "string" &&
          typeof q.topic === "string" &&
          typeof q.clue === "string" &&
          Array.isArray(q.options) && q.options.length === 4 &&
          q.options.every((option) => typeof option === "string") &&
          Number.isInteger(q.answer) && Number(q.answer) >= 0 && Number(q.answer) <= 3 &&
          typeof q.explanation === "string" && typeof q.hint === "string"
        ) as Question[];
        setRounds(getRoundsFromPool(valid.length >= TOTAL_ROUNDS ? valid : QUESTION_BANK));
      })
      .catch(() => {
        if (active) setRounds(getRounds());
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    void fetch("/api/games/progress", { method: "GET", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        return payload?.progress ?? null;
      })
      .then((progress) => {
        if (!active || !progress) return;
        setAccountProgress({
          best_score: Math.max(0, Number(progress.best_score) || 0),
          best_correct: Math.max(0, Number(progress.best_correct) || 0),
          games_completed: Math.max(0, Number(progress.games_completed) || 0),
        });
      })
      .catch(() => {
        // El juego sigue disponible aunque no se pueda consultar el progreso de la cuenta.
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // El progreso de esta sesión sigue funcionando aunque localStorage no esté disponible.
    }
  }, [saved, hydrated]);

  const question = rounds[index];
  // Cuatro cofres por partida: se desbloquean al llegar a 2, 5, 8 y 10 aciertos.
  // El máximo conseguido queda guardado entre reintentos; una respuesta incorrecta no suma progreso.
  const chestThresholds = [2, 5, 8, 10];
  const chestLevel = Math.max(
    Math.min(4, Number(saved.chests) || 0),
    chestThresholds.filter((threshold) => correctCount >= threshold).length,
  );
  const progress = finished ? 100 : Math.round((index / TOTAL_ROUNDS) * 100);
  const answeredCorrectly = selected !== null && question?.answer === selected;

  const chooseOption = useCallback((optionIndex: number) => {
    if (revealed || finished) return;
    setSelected(optionIndex);
    setRevealed(true);
    const current = rounds[index];
    if (!current) return;
    const isCorrect = optionIndex === current.answer;
    if (isCorrect) {
      setScore((value) => value + 100);
      setCorrectCount((value) => value + 1);
    }
    setSaved((value) => ({
      ...value,
      completedIds: value.completedIds.includes(current.id) ? value.completedIds : [...value.completedIds, current.id],
    }));
  }, [finished, index, revealed, rounds]);

  const next = useCallback(() => {
    if (!revealed) return;
    if (index + 1 >= rounds.length) {
      setFinished(true);
      setSaved((value) => ({
        ...value,
        bestScore: Math.max(value.bestScore, score),
        chests: Math.max(value.chests, chestThresholds.filter((threshold) => correctCount >= threshold).length),
      }));
      setSaveStatus("saving");
      void fetch("/api/games/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, correct: correctCount }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("No se pudo guardar el progreso de la cuenta.");
          const payload = await response.json();
          const progress = payload?.progress;
          if (progress) {
            setAccountProgress({
              best_score: Math.max(0, Number(progress.best_score) || 0),
              best_correct: Math.max(0, Number(progress.best_correct) || 0),
              games_completed: Math.max(0, Number(progress.games_completed) || 0),
            });
          }
          setSaveStatus("saved");
        })
        .catch(() => setSaveStatus("error"));
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setRevealed(false);
    setShowHint(false);
  }, [correctCount, index, revealed, rounds.length, score]);

  const restart = useCallback(() => {
    setRounds(getRounds());
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setCorrectCount(0);
    setHintsUsed([]);
    setShowHint(false);
    setFinished(false);
  }, []);

  const useHint = () => {
    if (!question || showHint) return;
    setShowHint(true);
    setHintsUsed((current) => current.includes(question.id) ? current : [...current, question.id]);
  };

  const totalCorrect = finished ? correctCount : correctCount;
  const earnedChests = chestLevel;

  const chestMessage = useMemo(() => {
    if (chestLevel >= 4) return "¡Los cuatro cofres están desbloqueados!";
    if (chestLevel >= 2) return "¡Vas muy bien! Sigue acertando para desbloquear el siguiente cofre.";
    if (chestLevel >= 1) return "¡Buen comienzo! Cada dos aciertos fortalecen tu recompensa.";
    return "Resuelve preguntas para llenar el cofre.";
  }, [chestLevel]);

  if (!hydrated || rounds.length === 0) {
    return <main className="grid min-h-[70vh] place-items-center bg-[#07091a] text-white"><p className="animate-pulse text-sm">Preparando el desafío...</p></main>;
  }

  const handleNext = () => {
    if (!revealed) return;
    try {
      const audio = new Audio("/sounds/navigation.mp3");
      audio.volume = 0.35;
      void audio.play().catch(() => undefined);
    } catch {
      // El sonido no debe bloquear la navegación.
    }
    if (!answeredCorrectly) {
      setSelected(null);
      setRevealed(false);
      setShowHint(false);
      return;
    }
    next();
  };

  return (
    <main className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#070b18] text-white">
      <div className="absolute inset-0 -z-30 bg-cover bg-center" style={{ backgroundImage: "url('/images/games/que-es-esa-vaina/que-es-esa-vaina-cover.png')" }} />
      <div className="absolute inset-0 -z-20 bg-[#040817]/30" />
      <div className="absolute inset-0 -z-10 bg-[#030817]/20" />
      <div className="ml-auto mr-[1vw] w-full max-w-[1390px] px-3 pb-8 pt-4 sm:px-5 lg:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/aprender/juegos" className="inline-flex min-h-10 items-center gap-2 border-[3px] border-[#77839d] bg-[#10172b]/95 px-3 py-2 text-xs font-black text-white shadow-[4px_4px_0_#030713] transition hover:bg-[#1c2942]"><ArrowLeft className="h-4 w-4" /> Todos los juegos</Link>
          <div className="border-[3px] border-[#77839d] bg-[#0a1026]/95 px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-[#f5d8ff] shadow-[4px_4px_0_#030713]"><Sparkles className="mr-1 inline h-4 w-4 text-[#f5c65d]" /> ¿Qué es esa vaina?</div>
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
          <section className="min-w-0 border-[3px] border-[#74809b] bg-[#070d22]/[.98] shadow-[0_0_0_3px_#11182d,7px_7px_0_rgba(0,0,0,.5)]">
            <header className="border-b-[3px] border-[#35415e] px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f0c86d] [font-family:var(--font-pixel),monospace]">Ronda {finished ? TOTAL_ROUNDS : index + 1} de {TOTAL_ROUNDS}</p><h1 className="mt-2 text-xl font-black text-white [font-family:var(--font-pixel),monospace] sm:text-xl">{finished ? "¡Desafío completado!" : "Descifra la pista"}</h1></div>
                <div className="flex flex-wrap items-stretch gap-2">
                  <div className="min-w-[95px] border-[3px] border-[#68738e] bg-[#080e20] px-3 py-2 text-center shadow-[3px_3px_0_#030713]"><p className="text-[9px] font-bold text-[#aab4cf]">Puntos</p><p className="mt-1 flex items-center justify-center gap-1 text-lg font-black text-[#ffd65c]">{score} <span className="text-xs">PTS</span></p></div>
                  <div className="min-w-[95px] border-[3px] border-[#68738e] bg-[#080e20] px-3 py-2 text-center shadow-[3px_3px_0_#030713]"><p className="text-[9px] font-bold text-[#aab4cf]">XP</p><div className="mt-1 flex items-center justify-center gap-1"><Image src="/peaky/homepage/xp.webp" alt="XP" width={24} height={24} className="h-6 w-6 object-contain" /><span className="text-sm font-black text-[#f2d68c]">—</span></div></div>
                  <div className="min-w-[105px] border-[3px] border-[#68738e] bg-[#080e20] px-3 py-2 text-center shadow-[3px_3px_0_#030713]"><p className="text-[9px] font-bold text-[#aab4cf]">Peak Coins</p><div className="mt-1 flex items-center justify-center gap-1"><Image src="/images/currency/peakcoin.webp" alt="Peak Coins" width={24} height={24} className="h-6 w-6 object-contain" /><span className="text-sm font-black text-[#7feaff]">—</span></div></div>
                </div>
              </div>
              <div className="mt-5 border-[3px] border-[#5e6983] bg-[#080e20] p-2 shadow-[inset_0_0_0_2px_#202b44]">
                <div className="mb-2 flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-[#f4d57e]">Progreso de la ronda</span><span className="text-[10px] font-black text-[#f4d57e]">{correctCount} / {TOTAL_ROUNDS}</span></div>
                <div className="relative flex h-8 items-center px-1"><div className="absolute left-1 right-1 top-1/2 h-3 -translate-y-1/2 border-2 border-[#7b8396] bg-[#171d2c]" /><div className="absolute left-1 top-1/2 h-3 -translate-y-1/2 border-y-2 border-[#fff0a6] bg-[#e8b936] transition-[width] duration-300" style={{ width: `calc(${Math.min(100, correctCount / TOTAL_ROUNDS * 100)}% - 8px)` }} /><div className="relative z-10 flex w-full items-center justify-between">{Array.from({ length: 4 }, (_, i) => { const unlocked = chestLevel > i; return <div key={i} className={`relative grid h-7 w-7 place-items-center border-2 ${unlocked ? "border-[#ffe08a] bg-[#4b3211]" : "border-[#566079] bg-[#101629]"} shadow-[2px_2px_0_#030713]`} title={unlocked ? "Cofre desbloqueado" : "Cofre pendiente"}><Image src="/images/games/poco-responda/cofre.png" alt="" width={24} height={24} className={`h-6 w-6 object-contain ${unlocked ? "" : "grayscale opacity-45"}`} />{unlocked && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-red-500" aria-label="Cofre desbloqueado" />}</div>; })}</div></div>
              </div>
            </header>
            {finished ? <div className="p-5 text-center sm:p-8"><h2 className="text-2xl font-black text-[#ffe28b]">¡Ronda terminada!</h2><p className="mt-2 text-sm text-slate-200">Acertaste {correctCount} de {TOTAL_ROUNDS} preguntas y conseguiste {score} puntos.</p><p className="mt-2 text-xs text-slate-400">{saveStatus === "saving" ? "Guardando tu progreso…" : saveStatus === "saved" ? "Progreso guardado en tu cuenta." : saveStatus === "error" ? "No se pudo guardar en la cuenta; tu partida local sigue disponible." : "Tu resultado está listo."}</p><div className="mx-auto mt-5 max-w-sm border-[3px] border-[#77839d] bg-[#0b1228] p-4 shadow-[5px_5px_0_#030713]"><Image src="/images/games/poco-responda/cofre.png" alt="Cofre de recompensas" width={180} height={130} className="mx-auto h-28 w-36 object-contain" /><div className="mt-3 flex gap-1.5">{Array.from({ length: 4 }, (_, i) => <div key={i} className={`h-3 flex-1 border-2 ${i < earnedChests ? "border-[#ffdc7a] bg-[#e8b936]" : "border-[#566079] bg-[#151c31]"}`} />)}</div><p className="mt-2 text-xs text-[#f5d987]">{earnedChests} / 5 fragmentos del cofre</p></div><div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-2 border-[3px] border-[#a8d99a] bg-[#287b42] px-5 text-xs font-black text-white shadow-[4px_4px_0_#102b1c] hover:bg-[#32934f]"><RotateCcw className="h-4 w-4" /> Jugar otra vez</button><Link href="/aprender/juegos" className="inline-flex min-h-11 items-center gap-2 border-[3px] border-[#737c93] bg-[#111a31] px-5 text-xs font-bold text-white hover:bg-[#1a2944]">Volver a juegos</Link></div></div> : question ? <div className="p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap gap-2"><span className="border-2 border-[#627d8d] bg-[#172b3a] px-3 py-1.5 text-[10px] font-black text-[#b8f3e7]">{question.subject}</span><span className={`border-2 px-3 py-1.5 text-[10px] font-black uppercase ${question.id.startsWith("hard-") ? "border-[#d18d73] bg-[#42261f] text-[#ffd0b8]" : question.id.startsWith("mid-") ? "border-[#c8ad59] bg-[#3b321b] text-[#ffe8a1]" : "border-[#6b9b83] bg-[#17372d] text-[#c2f3d5]"}`}>{question.id.startsWith("hard-") ? "Difícil · reto ICFES" : question.id.startsWith("mid-") ? "Media" : "Fundamentos"}</span></div>
              <div className="relative border-[4px] border-[#7d879e] bg-[#111a31] p-5 shadow-[inset_0_0_0_3px_#29344e,inset_0_0_0_6px_#080e20,6px_6px_0_#030713] sm:p-7"><div className="absolute left-2 top-2 h-2 w-2 bg-[#b7c0d3]" /><div className="absolute right-2 top-2 h-2 w-2 bg-[#b7c0d3]" /><div className="absolute bottom-2 left-2 h-2 w-2 bg-[#68738e]" /><div className="absolute bottom-2 right-2 h-2 w-2 bg-[#68738e]" /><div className="mb-4 flex h-10 w-10 items-center justify-center border-[3px] border-[#77829d] bg-[#252e49]"><CircleHelp className="h-5 w-5 text-[#f5d77c]" /></div><p className="text-base font-bold leading-7 text-white sm:text-lg sm:leading-8">{question.clue}</p><button type="button" onClick={useHint} disabled={showHint} className="mt-5 inline-flex min-h-10 items-center gap-2 border-[3px] border-[#8e8059] bg-[#28243a] px-3 text-xs font-black text-[#ffe7a2] shadow-[3px_3px_0_#050817] transition hover:bg-[#39334a] disabled:opacity-60"><Lightbulb className="h-4 w-4" /> {showHint ? "Pista revelada" : "Dame una pista"}</button>{showHint && <p className="mt-3 border-[3px] border-[#89774c] bg-[#242032] p-3 text-sm leading-6 text-[#ffedb8]">{question.hint}</p>}</div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{question.options.map((option, optionIndex) => { const isSelected = selected === optionIndex; const isCorrect = optionIndex === question.answer; const stateClass = !revealed ? "border-[#69748d] bg-[#111a31] hover:border-[#d8c16b] hover:bg-[#222a40]" : isCorrect ? "border-[#8bc79a] bg-[#193b32]" : isSelected ? "border-[#d58a91] bg-[#3b202d]" : "border-[#3c4762] bg-[#0b1226] opacity-75"; return <button key={option} type="button" onClick={() => chooseOption(optionIndex)} disabled={revealed} aria-pressed={isSelected} className={`relative flex min-h-[66px] items-center gap-3 border-[3px] p-4 text-left text-sm font-bold leading-6 shadow-[4px_4px_0_#030713] transition ${stateClass}`}><span className="absolute left-1 top-1 h-1.5 w-1.5 bg-[#aeb8ce]" /><span className="flex h-8 w-8 shrink-0 items-center justify-center border-[3px] border-[#69738c] bg-[#080e20] text-xs font-black text-[#f5d77c]">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{revealed && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[#a5e6b1]" />}{revealed && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 shrink-0 text-[#ff9aa5]" />}</button>; })}</div>
              {revealed && <div role="status" aria-live="polite" className={`mt-4 border-[3px] p-4 ${answeredCorrectly ? "border-[#80bd8d] bg-[#14352c]" : "border-[#ca858d] bg-[#351d2a]"}`}><p className="text-sm font-black">{answeredCorrectly ? "¡Correcto, bien hecho!" : "Esta vez no fue. ¡Aprendamos!"}</p><p className="mt-2 text-sm leading-6 text-white/85">{question.explanation}</p></div>}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-[10px] font-semibold text-[#b5bfd5]"><Clock3 className="h-4 w-4" /> Sin límite de tiempo: piensa con calma</p><button type="button" onClick={handleNext} disabled={!revealed} className="inline-flex min-h-11 items-center gap-2 border-[3px] border-[#a5d79a] bg-[#287b42] px-5 text-xs font-black text-white shadow-[4px_4px_0_#102b1c] transition hover:bg-[#32984f] active:translate-y-0.5 active:shadow-[2px_2px_0_#102b1c] disabled:cursor-not-allowed disabled:border-[#424b60] disabled:bg-[#222a3b] disabled:text-[#7c8497] disabled:shadow-none">{!answeredCorrectly ? "Intentar de nuevo" : index + 1 === TOTAL_ROUNDS ? "Ver resultados" : "Siguiente pregunta"} <ArrowRight className="h-4 w-4" /></button></div>
            </div> : null}
          </section>
          {!finished && <aside className="grid gap-4"><section className="border-[3px] border-[#746e88] bg-[#0a1026]/[.98] p-4 shadow-[5px_5px_0_rgba(0,0,0,.45)] sm:p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#f0d28a]">Recompensa de la ronda</p><h2 className="mt-2 text-base font-black">El cofre misterioso</h2><Image src="/images/games/poco-responda/cofre.png" alt="Cofre pixel art" width={260} height={190} className="mx-auto my-3 h-32 w-full object-contain drop-shadow-[0_5px_0_rgba(0,0,0,.5)]" /><div className="grid grid-cols-5 gap-1.5" aria-label={`${chestLevel} de 5 fragmentos del cofre`}>{Array.from({ length: 5 }, (_, i) => <div key={i} className={`h-3 border-[3px] ${i < chestLevel ? "border-[#ffe08a] bg-[#e8b936]" : "border-[#566079] bg-[#151b2d]"}`} />)}</div><p className="mt-3 text-xs font-black leading-5 text-[#ffe5a0]">{chestMessage}</p><p className="mt-2 text-[10px] leading-5 text-[#9da8c5]">Cada dos respuestas correctas llena un fragmento. Completa las {TOTAL_ROUNDS} preguntas para descubrir cuánto has aprendido.</p></section>
          <section className="border-[3px] border-[#5e6d8c] bg-[#081027]/[.98] p-4 shadow-[5px_5px_0_rgba(0,0,0,.4)] sm:p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#b8c8e9]">Pistas</p><div className="mt-3 grid gap-2"><button type="button" onClick={useHint} disabled={showHint} className={`flex items-center gap-3 border-[3px] p-3 text-left ${showHint ? "border-[#6e6484] bg-[#17172e] opacity-70" : "border-[#b58cdb] bg-[#251c3c] hover:bg-[#32234d]"}`}><span className="grid h-9 w-9 shrink-0 place-items-center border-[3px] border-[#8b75b5] bg-[#382a52]"><Lightbulb className="h-5 w-5 text-[#ffe36b]" /></span><span className="min-w-0"><span className="block text-sm font-black text-[#f4d8ff]">Pista 1</span><span className="block text-xs text-[#d8cce8]">{showHint ? "Ya revelada" : "Revelar una orientación"}</span></span></button><div className="flex items-center gap-3 border-[3px] border-[#35425e] bg-[#10172c] p-3 opacity-65"><span className="grid h-9 w-9 shrink-0 place-items-center border-[3px] border-[#405477] bg-[#152542] text-lg">◉</span><span><span className="block text-sm font-black text-[#a9dff4]">Pista 2</span><span className="block text-xs text-[#9da8c5]">Próximamente</span></span></div><div className="flex items-center gap-3 border-[3px] border-[#35425e] bg-[#10172c] p-3 opacity-65"><span className="grid h-9 w-9 shrink-0 place-items-center border-[3px] border-[#405477] bg-[#152542] text-lg">▤</span><span><span className="block text-sm font-black text-[#a9dff4]">Pista 3</span><span className="block text-xs text-[#9da8c5]">Próximamente</span></span></div></div></section></aside>}
        </div>
      </div>
    </main>
  );
}
