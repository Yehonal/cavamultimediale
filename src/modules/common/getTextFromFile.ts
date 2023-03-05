export default function getTextFromFile(textFile: string) {
  const headers = new Headers();
  headers.append(
    "Content-Type",
    "Content-type: text/plain; charset=iso-8859-1"
  );

  return fetch(textFile, { headers })
    .then(function (response) {
      return response.arrayBuffer();
    })
    .then(function (buffer) {
      const decoder = new TextDecoder("iso-8859-1");
      return decoder.decode(buffer);
    });
}
