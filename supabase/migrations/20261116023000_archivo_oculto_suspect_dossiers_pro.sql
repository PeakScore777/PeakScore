-- Archivo Oculto · Expediente 002: dossier investigativo revisado.
-- Sustituye textos provisionales por notas específicas, contrastables y limitadas a la evidencia narrativa.
-- Idempotente: actualiza únicamente las cuatro fichas de "El último testigo".

update public.game_reading_suspects s
set
  description = v.description,
  motive = v.motive,
  alibi = v.alibi,
  updated_at = now()
from public.game_reading_passages p
join (values
  (
    'Inés Salcedo',
    'Custodia habitual del archivador de Planeación y responsable de organizar la carpeta para la audiencia. Declaró haber terminado la revisión a las 6:10 p. m. y dejar el informe completo en el segundo cajón. Su acceso al mueble está documentado por la función que desempeñaba; no existe, en el expediente disponible, un registro individual de apertura del cajón durante el intervalo crítico.',
    'La discusión con el autor del estudio se centró en la inclusión de nombres de familias en el informe. Salcedo sostuvo que debían protegerse datos personales. Esa diferencia le daba un motivo para cuestionar la forma de circulación del documento, pero no demuestra que pretendiera alterar las mediciones ni retirar páginas.',
    'Una compañera la situó saliendo del edificio a las 6:18 p. m. El testimonio confirma la hora aproximada de salida, no el contenido de lo que llevaba. Tampoco acredita por sí solo que el informe permaneciera completo en el segundo cajón después de su última revisión.'
  ),
  (
    'Mateo Rincón',
    'Vigilante del turno de la tarde. El libro de novedades registra que abrió la puerta lateral a las 6:32 p. m., dentro del lapso en que la cámara del pasillo dejó de grabar (6:28–6:53). Rincón afirmó que comprobó el sensor desde el pasillo y que el técnico de alarmas nunca llegó. El registro acredita la apertura de la puerta, no un ingreso al archivo.',
    'El inventario de seguridad consigna que una copia de la llave del archivador fue entregada a vigilancia tres meses antes. Rincón afirmó que esa copia había sido devuelta, pero no presentó el comprobante. La cuestión investigativa no es solo quién tenía acceso por su cargo, sino quién conservaba materialmente la llave en la fecha de los hechos.',
    'Su versión sostiene que permaneció en el pasillo revisando el sensor y que no recibió al técnico. La interrupción de la cámara impide corroborar visualmente ese recorrido. La apertura lateral consta en el registro; la entrada al archivo y la manipulación del archivador no están acreditadas.'
  ),
  (
    'Vera Pardo',
    'Periodista de una emisora comunitaria. Llevaba dos semanas solicitando el informe y había cuestionado públicamente la transparencia de la audiencia. El registro de visitantes sitúa su ingreso a Planeación a las 5:20 p. m. y su salida a las 5:58 p. m. A las 7:12 p. m. remitió a la emisora un correo con una fotografía de una tabla de mediciones, no con el informe completo.',
    'La publicación de la tabla podía darle una primicia y Pardo reconoció ese interés. La fotografía coincide con un fragmento hallado después en la papelera del equipo PL-02; esa correspondencia vincula el contenido, pero no identifica a quien imprimió la hoja ni demuestra que la periodista retirara el original.',
    'Pardo declaró que recibió la imagen de una fuente anónima después de salir de Planeación, aproximadamente a las 6:05 p. m. El registro no muestra un segundo ingreso y el correo de las 7:12 confirma la hora de envío, no la procedencia de la imagen. La identidad de la fuente y la ruta de entrega siguen sin verificarse.'
  ),
  (
    'Tomás Leal',
    'Ingeniero participante en el estudio hídrico. Advirtió que algunas mediciones de la quebrada La Honda no coincidían con las cifras resumidas en la presentación del proyecto y pidió corregirlas antes de la audiencia. Afirmó haber entregado el informe firmado a las 4:40 p. m. y conservaba una copia digital de trabajo llamada «tabla_final», vinculada al mismo conjunto de mediciones.',
    'Su interés era que las cifras presentadas en la audiencia correspondieran con las mediciones que consideraba correctas. La discrepancia podía afectar la credibilidad del estudio y la discusión pública del proyecto. Ese interés explica su intervención técnica y el valor de conservar una copia, pero no establece que quisiera sustraer el informe firmado.',
    'Leal dijo haberse marchado a las 5:05 p. m. Una fotografía lo muestra en una reunión vecinal de otro barrio a las 6:25, aunque no determina cuánto tiempo permaneció allí ni quién tomó la imagen. El archivo «tabla_final» figura modificado a las 6:47; Leal atribuyó la hora a una posible sincronización automática. Ambos datos requieren corroboración independiente.'
  )
) as v(name, description, motive, alibi) on true
where p.game_key = 'archivo-oculto'
  and p.title = 'El último testigo'
  and s.passage_id = p.id
  and s.name = v.name;
