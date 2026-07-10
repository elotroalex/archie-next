---
title: authors
permalink: es/authors.html
---

_archipelagos_ es una revista dedicada a la práctica digital, publica artículos académicos, proyectos digitales y reseñas de proyectos digitales relacionados con el Caribe. Publicamos un número por año y aceptamos envíos de forma continua.

_archipelagos_ acepta envíos en inglés, español y francés. Publicaremos ensayos aceptados en su idioma original con resúmenes traducidos por nuestro equipo editorial. También damos la bienvenida a los contribuyentes para solicitar servicios de traducción para el texto completo de su contribución, que habremos corregido para su inclusión en la revista.

Todas las contribuciones deben acatar el [Manual de Estilo de Chicago](https://www.chicagomanualofstyle.org/home.html).

Contact: archipelagosjournal@gmail.com

---

**Índice**{.toc-label}

[[toc]]

---

## Pautas de envío de artículos o reseñas

_archipelagos_ se basa en principios de computación mínima. Alentamos a nuestros autores a que nos ayuden a evitar la redundancia y los flujos de trabajo costosos. Entendemos que los entornos y formatos desconocidos pueden ser difíciles de manejar, y estas pautas son un trabajo en progreso a medida que nos esforzamos por lograr el equilibrio adecuado entre las necesidades de nuestros autores y nuestra misión. Sus ideas son bienvenidas.

### Notas generales

_archipelagos_ utiliza una combinación de correo electrónico, Dropbox y GitHub para administrar [el flujo de trabajo editorial](http://archipelagosjournal.org/es/about.html#nuestro-flujo-de-trabajo). Le pedimos que envíe sus resúmenes y artículos a <archipelagosjournal@gmail.com>. La mayoría de los intercambios con los autores se realizarán por correo electrónico utilizando esta cuenta.

1. Las entregas de artículos individuales se aceptan de forma continua. También aceptamos propuestas para secciones temáticas.

2. Las presentaciones de artículos deben incluir una biografía (o biografías para varios autores) y un resumen. Por favor colóquelos al final de su documento. Las imágenes pueden insertarse directamente en su documento (véase [Imágenes](#imagenes) más abajo) — ya no es necesario enviarlas por separado. El video y el audio deben seguir enviándose como enlaces a un servicio de transmisión de su elección (véase [Video, sonido y medios interactivos](#video-sonido-y-medios-interactivos) más abajo).

3. Somos una revista de acceso abierto. Si es aceptado para su publicación, recibirá una copia de nuestro Acuerdo con el autor (véase la sección [Acuerdo con el autor](#acuerdo-con-el-autor) más abajo).

4. Los artículos son revisados a doble ciego por nuestro equipo de revisores externos. Las reseñas son revisadas por los editores de _archipelagos_. Los contribuyentes reciben una notificación por escrito de los editores (aceptada, aceptada con revisiones menores, revisiones sustantivas requeridas o rechazadas) dentro de los dos meses posteriores a la presentación.

5. La corrección comienza cuando se completa con éxito el proceso de revisión por pares. Los contribuyentes pueden esperar recibir un archivo actualizado con sugerencias y consultas de nuestro editor de copias. El archivo revisado debe devolverse dentro de las dos semanas posteriores a la recepción. Esta será la última oportunidad para realizar cambios sustanciales en el archivo. Los contribuyentes recibirán un PDF final y un enlace al sitio cercano al lanzamiento para modificaciones menores.

6. A lo largo del proceso de edición y producción, se espera que los contribuyentes vigilen el correo electrónico para cualquier consulta de última hora de los editores de _archipelagos_. Las respuestas rápidas ayudarán a mantener horarios.

### Tipos de archivos

#### Documentos

_Formatos de Office (.odt, .doc, .docx)_: La mayor parte de la limpieza que hacemos a mano se debe a un puñado de hábitos de formato. Si sigue los puntos a continuación, su archivo se convertirá a nuestro formato de publicación casi automáticamente — le pedimos que los lea con atención.

1. **Utilice los estilos de Encabezado integrados de Word para los títulos de sus secciones — nunca use negrita.** Aplique "Encabezado 2" (Heading 2, desde el menú Estilos) a su primera sección, y "Encabezado 3" (Heading 3) para cualquier subsección dentro de ella. El texto en negrita, subrayado o de mayor tamaño que solo está hecho para _parecer_ un encabezado es invisible para nuestra herramienta de conversión — no tiene forma de distinguirlo de una palabra en negrita en medio de una oración, y las divisiones de sus secciones se perderán.

   ![Comparación entre texto en negrita confundido con un encabezado y texto con el estilo Encabezado 2 de Word correctamente aplicado, para que las divisiones de sección se conviertan automáticamente](/public/images/authors-guide/heading-styles-es.png)

2. **Enlace el texto directamente**, en lugar de escribir la URL completa dentro de la oración. En las notas al pie, haga ambas cosas — escriba el enlace completo _y_ enlácelo, por ejemplo: [http://example.com](http://example.com/).
3. **Incluya siempre `http://` o `https://`** al comienzo de un enlace, o no funcionará una vez convertido.
4. **Desactive las "comillas inteligentes".** Utilice comillas rectas (`"` y `'`), no las curvas que Word inserta de forma predeterminada.
5. **Use guiones simples**: un guion (`-`) para palabras compuestas, un guion medio (`--`) para rangos, una raya (`---`) para un corte en la oración.
6. **No diseñe el documento usted mismo.** Las columnas, los cuadros de texto y el espaciado colocado manualmente no sobrevivirán la conversión. Si necesita algo con un diseño particular, descríbalo en prosa simple, [entre corchetes], y nosotros nos encargaremos del resto.
7. **No use la herramienta de tablas ni los campos de datos de Word.** Consulte [Tablas](#tablas) más abajo para conocer los formatos que aceptamos.
8. **Inserte las imágenes directamente donde correspondan y luego agrégueles un pie de foto con una breve rúbrica.** Consulte [Imágenes](#imagenes) más abajo.

_Markdown (.md)_: la publicación es, en muchos sentidos, un juego de conversiones de archivos de un formato a otro. Tanto nuestro sitio web como nuestros PDF se crean a partir de los mismos archivos de Markdown. Aceptamos con gusto los artículos esritos en texto sin formato (codificación UTF-8), utilizando el Markdown con [sintaxis Kramdown](http://kramdown.gettalong.org/syntax.html), y con la extensión .md. Esto nos ayudará a mantener nuestro flujo de trabajo ligero y nuestros tipos de archivos más cerca de la línea de producción, contribuyendo a su vez al control continuo de todos los aspectos de la producción de nuestra revista. Para obtener algunos antecedentes sobre nuestras opciones de infraestructura, y para comenzar con Markdown, tómese un tiempo para leer "[Sustainable Authorship in Plain Text using Pandoc and Markdown](http://programminghistorian.org/lessons/sustainable-authorship-in-plain-text-using-pandoc-and-markdown)", por Dennis Tenen y Grant Whytoff. Agradecemos sinceramente a quienes aceptan el desafío de cambiar sus hábitos de trabajo y les brindamos nuestra asistencia durante el proceso. Encontrará muchas herramientas de edición de Markdown disponibles, y la mayoría de los editores de texto plano son igualmente excelentes para manejar el mismo.

#### Imágenes

En _archipelagos_ valoramos la riqueza de nuestra cultura visual. Si envía su propia fotografía, tenga en cuenta el encuadre, las armonías de color y otros elementos de diseño. Recuerde también que los archivos de imagen pueden contener metadatos incrustados que quizás no desee publicar. Las imágenes están sujetas al proceso de revisión al igual que su texto.

Proporcione imágenes nítidas: una resolución mínima de 144ppi y al menos 800 píxeles de ancho. JPG es nuestro formato preferido; PNG está bien para imágenes con transparencia o colores planos simples (por ejemplo, un logotipo).

**Inserte cada imagen directamente en su documento, en el lugar donde corresponda** — de la misma manera en que normalmente agregaría una imagen en Word (Insertar > Imágenes). Ya no necesita enviarnos las imágenes por separado en un archivo zip; nuestra herramienta de conversión las extrae automáticamente de su documento.

Justo debajo de cada imagen, escriba tres líneas breves de texto plano — una línea en blanco (Enter) entre cada una, sin viñetas, y sin saltos de línea manuales en medio de una línea:

```text
caption="insert caption here"
alt="insert alt text here."
url="http://optional-url.com"
```

![Diagrama de una foto insertada seguida de los campos de texto caption, alt y url (opcional), con cada campo explicado: caption se muestra a todos los lectores, alt lo leen los lectores de pantalla, url es un enlace opcional](/public/images/authors-guide/image-captioning-es.png)

- **`caption`** se muestra a todos los lectores, impreso debajo de la imagen en el sitio y en el PDF.
- **`alt`** lo leen en voz alta los lectores de pantalla. Describa lo que _hay_ en la imagen — no repita simplemente el pie de foto.
- **`url`** es opcional. Inclúyalo solo si la imagen misma debe enlazar a algún lugar, como su fuente original.

`caption` y `alt` son obligatorios; `url` es opcional. Si alguno necesita incluir comillas, escápelas con una barra invertida, por ejemplo: `caption="Ella dijo \"hola\" a la cámara"`.

_¿Todavía no ha insertado su imagen? ¿Está enviando su archivo en Markdown?_ Si trabaja en Word y aún no ha agregado la foto, o si está enviando su archivo directamente en Markdown (donde no existe un paso de "insertar imagen"), use un marcador de posición en su lugar: escriba la misma rúbrica anterior, pero agregue una línea más _arriba_ de las demás con el nombre de archivo de la imagen, y envíenos ese archivo por separado junto con su documento:

```text
img="my-image.jpg"
caption="insert caption here"
alt="insert alt text here."
url="http://optional-url.com"
```

Si usa un marcador de posición, nombre el archivo con una o dos palabras clave separadas por un guion, sin espacios ni letras mayúsculas (por ejemplo, `harbor-sunset.jpg`) — esto pasa a formar parte de la dirección permanente del archivo en nuestro sitio.

#### Video, sonido y medios interactivos

Para que nuestros artículos y reseñas estén disponibles en PDF, y para aumentar la longevidad de los archivos web, separamos los medios interactivos del texto estático y las imágenes. Para video y sonido, alentamos a nuestros autores a usar un servicio de transmisión de su elección (SoundCloud, YouTube, etc). Tenga en cuenta las preocupaciones de privacidad, estabilidad y derechos de autor al elegir la transmisión de video. Cuando sea necesario, podemos proporcionarle un Formulario de Acuerdo de Publicación Digital para usar con los dueños de derechos de autor.

Dado que _archipelagos_ nació de la necesidad de apoyar formas emergentes de investigación digital, también estamos abiertos a incluir medios interactivos (por ejemplo, mapas, visualizaciones) en nuestros artículos. Le pedimos que nos proporcione, siempre que sea posible, una versión de pantalla completa de sus medios interactivos alojados en otro lugar.

Para incluir cualquiera de estos tipos de medios, tome una captura de pantalla e insértela directamente en su documento como cualquier otra imagen (véase [Imágenes](#imagenes) más arriba), y luego use la misma rúbrica de caption/alt/url — con `url` apuntando a la versión de pantalla completa (siempre que sea posible) de su medio interactivo, archivo de sonido o video. Cuando sea apropiado, use una captura de pantalla con el botón de reproducción visible. Por ejemplo, si se trata de un video de YouTube, tome una captura de pantalla de la versión de pantalla completa con el botón de reproducción rojo y blanco en el centro.

### Enlaces

Todas las páginas referenciadas, siempre que sea posible, deben apuntar a una copia archivada específica en [el Internet Archive](https://archive.org/index.php). Si aún no existe una copia, cree una utilizando su función "[Guardar página ahora](https://archive.org/web/)". Háganos saber si necesita ayuda con este proceso.

Asegúrese de que todos los enlaces externos e internos de su documento estén funcionando antes de enviarlos. Muchos sitios web y páginas web desaparecen o se desplazan con el tiempo. Para evitar _la descomposición del enlace_, realizamos pruebas de compilación periódicas para garantizar la viabilidad de nuestros enlaces internos y externos. A pesar de estas medidas, algunos enlaces se perderán en los próximos años. Para minimizar el impacto en su artículo, proporcione las citas apropiadas cuando los enlaces sean fundamentales para el argumento y no pueda proporcionar una copia archivada en el Archivo de Internet.

### Documentos externos

Al compartir documentos externos, no se vincule a servicios de almacenamiento en la nube (por ejemplo, Dropbox, Google Docs) ni a fuentes de acceso cerrado. En estos casos, simplemente cite los documentos. Si tiene permiso para usarlos, puede enviarlos con sus archivos. Damos la bienvenida y alentamos los enlaces a repositorios institucionales abiertos.

### Tablas

Si desea que se muestre una tabla mientras lee su texto, puede enviarla como un archivo .csv (valores separados por comas) o escrito directamente en [kramdown/Markdown](http://kramdown.gettalong.org/syntax.html#tables), su formato final. En general, preferimos los formatos de tabla más simples. Evite los espacios en filas, por ejemplo. Si desea enviar una tabla más compleja, puede hacerlo como un PDF separado. Luego vincularíamos a la tabla desde el texto.

Si cree que necesita una visualización aún más compleja, considere enviar una imagen o alojar la visualización en otro servidor y vincularla desde una captura de pantalla.

**No aceptamos tablas en formato Office.**

## Pautas para proyectos digitales

_archipelagos_ acepta proyectos digitales en etapa de desarollo intermedia para una revisión anónima de una vía, luego de que nuestro equipo editorial haya tenido una primera ronda de aprobación.

Se ofrecerá una versión pulida de los comentarios de los revisores al equipo del proyecto, o al director, como proveniente de _archipelagos_ y escrita en el "nosotros" real. Esperamos que el equipo tome en serio las sugerencias de nuestros revisores y, que haga los cambios indicados al proyecto, siempre que estos sean factibles.

A lo largo del proceso de revisión y publicación, nuestro equipo editorial trabajará con usted para brindarle comentarios constructivos sobre su proyecto. Por supuesto, usted sigue siendo responsable del desarrollo y mantenimiento de su proyecto antes y después de que lo presentemos en nuestra revista. Si su proyecto es aceptado en nuestra sección de proyectos digitales, también publicaremos el intercambio de revisiones entre nuestros revisores y su equipo. Si el proceso de revisión resulta satisfactoria para ambas partes, ofrecemos la oportunidad de lanzar o resaltar su proyecto tras la publicación en _archipelagos_.

Además de revisar proyectos directamente, apoyamos "narrativas de proyectos" de modo ensayo que describen el proceso, la infraestructura o ofertas principales y originales de un proyecto digital dado. Estos ensayos pasan por el mismo método de revision anónima de una vía que los proyectos, y se publicarán en la misma sección que los proyectos. Si tiene alguna pregunta sobre cuál es la opción más adecuada para usted, no dude en contactarnos.

Estamos particularmente interesados en apoyar proyectos que hagan una importante contribución académica al estudio del Caribe; que son conscientes del proceso de diseño y las infraestructuras subyacentes de la tecnología digital; que reconocen la contribución de todos los miembros del equipo adecuadamente; y que han tenido en cuenta cuestiones de longevidad y efimeridad. Para obtener una idea más detallada de nuestros criterios y procesos, consulte [las pautas que hemos preparado para nuestros revisores](https://archipelagosjournal.org/reviewers.html).

La revisión directa del proyecto ocurre en dos fases:

1. Los autores envían una Declaración del proyecto que consta de una descripción de 500 a 700 palabras. Los revisores ofrecerán comentarios iniciales dentro de cuatro a seis semanas según la descripción y una exploración del proyecto. Si el proyecto todavía está en versión beta y no está disponible públicamente, debe compartir un enlace al sitio de desarrollo. Nos aseguraremos de que el enlace no abandone nuestros círculos editoriales.

2. Los autores responden a los comentarios de los revisores en una narrativa de 1000 a 1200 palabras y proporcionan un enlace a un sitio beta navegable para la revisión final.

3. Los editores escribirán una introducción al proyecto y compilarán la propia introducción del proyecto escrita exclusivamente para nosotros, los comentarios del revisor y la respuesta del equipo del proyecto o el líder para la publicación final en una página dedicada al proyecto.

Los ensayos de descripción del proyecto seguirán el mismo proceso que la revisión de un artículo.

## Acuerdo con el autor

Lea nuestro [Acuerdo con el autor](https://archipelagosjournal.org/public/author-agreement.pdf). Este Acuerdo refleja la posición de que los/las autores/ras conservan los derechos de autor del Artículo y tienen derechos explícitos para usar el Artículo en futuros proyectos de investigación, enseñanza y otros. Los derechos de autor se definen de la siguiente manera:

- Los/las autores/ras mantienen los derechos de autor sin restricciones;
- Los/las autores/ras otorgan a *archipelagos* la autoridad para publicar su trabajo en la revista con una licencia internacional [Creative Commons Attribution 4.0](http://creativecommons.org/licenses/by/4.0/);
- Los autores mantienen los derechos de publicación sin restricciones.
