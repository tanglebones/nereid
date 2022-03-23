using System.Net;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace wlb;
// To list the internal firewall url list:
//   netsh http show urlacl 
// To allow adding the listener you need to do, in an Administrator cmd.exe:
//   netsh http add urlacl url=http://+:80/ user=NWM\%USERNAME%

internal static class Program {
  private const string ContentTypeTextPlain = "text/plain";
  private const string TopLevelDomain = "xxx";
  private static CancellationToken _token;
  private static string? _webRoot;
  private static string? _srvRoot;
  private static readonly HttpClient HttpClientInstance = new(); 
  private static readonly Dictionary<string, ushort> PortMappings = new();

  private static readonly Dictionary<string, string> ExtToMimeType = new() {
    {"3gp", "video/3gpp"},
    {"3gpp", "video/3gpp"},
    {"7z", "application/x-7z-compressed"},
    {"ai", "application/postscript"},
    {"asf", "video/x-ms-asf"},
    {"asx", "video/x-ms-asf"},
    {"atom", "application/atom+xml"},
    {"avi", "video/x-msvideo"},
    {"bin", "application/octet-stream"},
    {"bmp", "image/x-ms-bmp"},
    {"cco", "application/x-cocoa"},
    {"crt", "application/x-x509-ca-cert"},
    {"css", "text/css"},
    {"deb", "application/octet-stream"},
    {"der", "application/x-x509-ca-cert"},
    {"dll", "application/octet-stream"},
    {"dmg", "application/octet-stream"},
    {"doc", "application/msword"},
    {"docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    {"ear", "application/java-archive"},
    {"eot", "application/vnd.ms-fontobject"},
    {"eps", "application/postscript"},
    {"exe", "application/octet-stream"},
    {"flv", "video/x-flv"},
    {"gif", "image/gif"},
    {"hqx", "application/mac-binhex40"},
    {"htc", "text/x-component"},
    {"htm", "text/html"},
    {"html", "text/html"},
    {"ico", "image/x-icon"},
    {"img", "application/octet-stream"},
    {"iso", "application/octet-stream"},
    {"jad", "text/vnd.sun.j2me.app-descriptor"},
    {"jar", "application/java-archive"},
    {"jardiff", "application/x-java-archive-diff"},
    {"jng", "image/x-jng"},
    {"jnlp", "application/x-java-jnlp-file"},
    {"jpeg", "image/jpeg"},
    {"jpg", "image/jpeg"},
    {"js", "application/javascript"},
    {"json", "application/json"},
    {"kar", "audio/midi"},
    {"kml", "application/vnd.google-earth.kml+xml"},
    {"kmz", "application/vnd.google-earth.kmz"},
    {"m3u8", "application/vnd.apple.mpegurl"},
    {"m4a", "audio/x-m4a"},
    {"m4v", "video/x-m4v"},
    {"mid", "audio/midi"},
    {"midi", "audio/midi"},
    {"mml", "text/mathml"},
    {"mng", "video/x-mng"},
    {"mov", "video/quicktime"},
    {"mp3", "audio/mpeg"},
    {"mp4", "video/mp4"},
    {"mpeg", "video/mpeg"},
    {"mpg", "video/mpeg"},
    {"msi", "application/octet-stream"},
    {"msm", "application/octet-stream"},
    {"msp", "application/octet-stream"},
    {"odg", "application/vnd.oasis.opendocument.graphics"},
    {"odp", "application/vnd.oasis.opendocument.presentation"},
    {"ods", "application/vnd.oasis.opendocument.spreadsheet"},
    {"odt", "application/vnd.oasis.opendocument.text"},
    {"ogg", "audio/ogg"},
    {"pdb", "application/x-pilot"},
    {"pdf", "application/pdf"},
    {"pem", "application/x-x509-ca-cert"},
    {"pl", "application/x-perl"},
    {"pm", "application/x-perl"},
    {"png", "image/png"},
    {"ppt", "application/vnd.ms-powerpoint"},
    {"pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"},
    {"prc", "application/x-pilot"},
    {"ps", "application/postscript"},
    {"ra", "audio/x-realaudio"},
    {"rar", "application/x-rar-compressed"},
    {"rpm", "application/x-redhat-package-manager"},
    {"rss", "application/rss+xml"},
    {"rtf", "application/rtf"},
    {"run", "application/x-makeself"},
    {"sea", "application/x-sea"},
    {"shtml", "text/html"},
    {"sit", "application/x-stuffit"},
    {"svg", "image/svg+xml"},
    {"svgz", "image/svg+xml"},
    {"swf", "application/x-shockwave-flash"},
    {"tcl", "application/x-tcl"},
    {"tif", "image/tiff"},
    {"tiff", "image/tiff"},
    {"tk", "application/x-tcl"},
    {"ts", "video/mp2t"},
    {"txt", "text/plain"},
    {"war", "application/java-archive"},
    {"wbmp", "image/vnd.wap.wbmp"},
    {"webm", "video/webm"},
    {"webp", "image/webp"},
    {"wml", "text/vnd.wap.wml"},
    {"wmlc", "application/vnd.wap.wmlc"},
    {"wmv", "video/x-ms-wmv"},
    {"woff", "application/font-woff"},
    {"xhtml", "application/xhtml+xml"},
    {"xls", "application/vnd.ms-excel"},
    {"xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
    {"xml", "text/xml"},
    {"xpi", "application/x-xpinstall"},
    {"xspf", "application/xspf+xml"},
    {"zip", "application/zip"},
  };

  private static void IgnoreFailure(Action a) {
    try {
      a();
    }
// ReSharper disable EmptyGeneralCatchClause
    catch
// ReSharper restore EmptyGeneralCatchClause
    {
    }
  }

  private static async Task IgnoreFailureAsync(Func<Task> a) {
    try {
      await a();
    }
// ReSharper disable EmptyGeneralCatchClause
    catch
// ReSharper restore EmptyGeneralCatchClause
    {
    }
  }

  public static void Main(string[] args) {
    Configure();
    Server(4);
  }

  private static void Configure() {
    var cd = Directory.GetCurrentDirectory();
    while (!string.IsNullOrEmpty(cd)) {
      var candidate = Path.Combine(cd, "web");
      if (Directory.Exists(candidate)) {
        _srvRoot = Path.Combine(cd, "srv");
        _webRoot = candidate;
        break;
      }

      cd = Path.GetDirectoryName(cd);
    }

    if (string.IsNullOrEmpty(_srvRoot) || string.IsNullOrEmpty(_webRoot)) {
      throw new Exception("Could not find web root.");
    }

    Console.WriteLine($"web: {_webRoot}");
    Console.WriteLine($"srv: {_srvRoot}");
    foreach (var sd in Directory.EnumerateDirectories(_srvRoot)) {
      var domain = Path.GetFileName(sd).ToLowerInvariant();
      var portFile = Path.Combine(sd, "port_mapping.json");
      if (!File.Exists(portFile)) {
        continue;
      }

      var pm = JObject.Parse(File.ReadAllText(portFile));
      foreach (var kvp in pm) {
        var subdomain = $"{kvp.Key}.{domain}";
        var port = kvp.Value!.Value<ushort>();
        PortMappings[subdomain] = port;
        Console.WriteLine($"{subdomain}.xxx:{port}");
      }
    }
  }

  private static void Server(int numConcurrent) => IgnoreFailure(
    () => {
      using var hl = new HttpListener();
      var tasks = new Task[numConcurrent];
      var cts = new CancellationTokenSource();
      _token = cts.Token;
      try {
        hl.Prefixes.Add("http://+:80/");
        hl.Start();
      }
      catch (Exception ex) {
        Console.WriteLine(ex);
        Environment.Exit(-1);
      }

      for (var i = 0; i < tasks.Length; ++i) {
        Start(tasks, i, hl);
      }

      Console.WriteLine("Press any key to stop server.");
      Console.ReadKey();
      cts.Cancel();
      foreach (var t in tasks) {
        t.Wait(TimeSpan.FromSeconds(30));
      }

      hl.Stop();
    }
  );

  private static void Start(IList<Task> tasks, int i, HttpListener hl) =>
    tasks[i] =
      hl
        .GetContextAsync()
        .ContinueWith(ProcessRequest, _token)
        .ContinueWith(_ => Start(tasks, i, hl), _token);

  private static async Task ProcessRequest(Task<HttpListenerContext> task) => await IgnoreFailureAsync(
    async () => {
      if (!task.IsCompleted) {
        return;
      }

      var ctx = task.Result;
      var request = ctx.Request;
      var response = ctx.Response;

      var url = request.Url;
      if (url != null) {
        var host = url.Host.ToLowerInvariant();
        await Console.Out.WriteLineAsync($"{DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss")}Z {url}");

        var urlHostParts = host.Split('.').Reverse().ToArray();
        if (urlHostParts.Length > 1 && urlHostParts[0] == TopLevelDomain) {
          var domain = urlHostParts[1];
          if (urlHostParts.Length == 2 || urlHostParts.Length == 3 && urlHostParts[2] == "www") {
            var fileName = url.PathAndQuery.Split(new char[] {'?', '#'}).First();

            if (fileName == string.Empty || fileName.EndsWith('/')) {
              fileName += "index.html";
            }

            fileName = fileName.TrimStart('/');

            var filePath = Path.Combine(_webRoot!, domain, "dist", fileName);

            if (File.Exists(filePath)) {
              await SendFile(response, filePath);
            }
            else {
              await SendResponse(response, 404, "Not Found");
            }
            return;
          }

          // note, because ssl certs do not support *.*.domain.tld we only support one level of subdomain.
          ushort port;
          if (urlHostParts.Length == 3 && PortMappings.TryGetValue($"{urlHostParts[2]}.{domain}", out port)) {
            await ProxyCall(response, request, port);
            return;
          }
        }
      }
      await SendResponse(response, 400, "Invalid Request");
    }
  );

  private static async Task ProxyCall(HttpListenerResponse response, HttpListenerRequest request, ushort port) {
    await Console.Out.WriteLineAsync($"proxy to {request.HttpMethod} http://127.0.0.1:{port}{request.Url!.PathAndQuery}");
    // ugh, HttpClient and HttpListen have totally different APIs!
    // and proxying WebSockets is none-trivial.

    await SendResponse(response, 503, $"Todo: proxy to {request.HttpMethod} http://127.0.0.1:{port}{request.Url!.PathAndQuery}");
  }

  private static async Task SendResponse(HttpListenerResponse response, int statusCode, string body, string contentType = ContentTypeTextPlain) {
    response.ContentType = contentType;
    response.StatusCode = statusCode;
    var bytes = Encoding.UTF8.GetBytes(body);
    response.ContentLength64 = bytes.Length;
    await response.OutputStream.WriteAsync(bytes, _token);
    response.Close();
  }

  private static async Task SendFile(HttpListenerResponse response, string filePath, string? contentType = null) {
    response.ContentType = ContentTypeForFile(filePath, contentType);
    response.StatusCode = 200;
    // todo: chunk large files; memory cache small files.
    var bytes = await File.ReadAllBytesAsync(filePath, _token);
    response.ContentLength64 = bytes.Length;
    await response.OutputStream.WriteAsync(bytes, _token);
    response.Close();
  }

  private static string ContentTypeForFile(string filePath, string? contentType) {
    var extension = Path.GetExtension(filePath).TrimStart('.');

    string? ct;
    if (!ExtToMimeType.TryGetValue(extension, out ct)) {
      ct = contentType ?? "application/octet-stream";
    }
    return ct;
  }
}
