# Sofia Vallejo

My personal site, built as a tiny retro desktop floating in pastel pixel space. A cat with a rainbow flies by every now and then. There's salsa on vinyl if you let it.

**→ [sofiavallejob.github.io](https://sofiavallejob.github.io)**

I'm Sofia Vallejo, an audio engineer and PhD candidate in Sonic Interaction Design at IEM, Kunstuniversität Graz. The site collects my research on sonification, projects, music production credits and photos.

## What's inside

| Window | What it is |
| --- | --- |
| **About.txt** | Who I am, plus the important stuff (food, games, Star Wars) |
| **Research** | Papers, awards, talks |
| **Projects** | Sonification, audio ML and Pure Data things, newest first |
| **Music.amp** | A Winamp-ish player with tracks I recorded, mixed, mastered or played bass on |
| **Teaching** | Courses I've TA'd, including Musical Acoustics |
| **Fotos** | Photos I've taken |
| **Minesweeper** | Minesweeper, with cats |
| **CV.pdf** | The short version, with a download |

## How it's made

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.

- `index.html`: all the content. Each window is a `<section class="win">`.
- `assets/css/style.css`: the look (beveled 90s chrome, pastel title bars)
- `assets/js/main.js`: the window manager, the pixel-space wallpaper, the music player and Minesweeper.
- Fonts: [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) and [IBM Plex](https://fonts.google.com/specimen/IBM+Plex+Sans)

To run it locally, open `index.html` in a browser. The YouTube parts (background music, some Music.amp tracks) need a local server:

```sh
python3 -m http.server
# then open http://localhost:8000
```

## Little how-tos (mostly for future me)

- **Add a photo:** put it in `assets/img/fotos/`, then copy the example line from the comment in the Fotos section of `index.html`.
- **Add a track:** copy an `<li>` in the Music.amp playlist and change the cover, names, roles and embed URL.
- **Change the background song:** change `data-video` on `<div class="radio">` to another YouTube video ID.
- **Update the CV:** replace `assets/cv/Sofia_Vallejo_CV.pdf`.
- **Deep links:** `#research`, `#projects`, `#music`, etc. open that window directly.

## License

The **code** is MIT licensed (see [LICENSE](LICENSE)), so feel free to borrow the window manager, the wallpaper or anything else for your own site. A link back is nice but not required.

The **content** is not covered by that license: the text, my CV, photos, cover art, music and the cat photo stay mine (or their owners'). Please don't reuse those without asking.

The background music is "Salsa Colombiana Clásica, Brava & Romántica [Vinyl Studio Session] with LAFLOR" by [Humano Studios](https://www.youtube.com/@HumanoStudios), streamed from YouTube.
