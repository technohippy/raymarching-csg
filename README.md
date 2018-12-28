3D JSON 3D Viewer
====

開発合宿の成果。

レイマーチング＋CSGを使用して、nfmdc\_2d3dconverterで生成されるJSONファイルを3D表示する。

![スクリーンショット](https://bitbucket.org/kabuku/nfmdc_3dviewer/raw/d0e889de6310b2b76a046b82d3cc7763f4e8051f/img/screenshot.png)

実行
----

    $ git clone git@bitbucket.org:yasushiando/nfmdc-3dviewer.git
    $ cd nfmdc-3dviewer
    $ python -m http.server 8000
    $ open http://localhost:8000

TODO
----

面取りやRの実現方法について要調査。特に面取り。

Ref.
----

- https://qiita.com/gam0022/items/03699a07e4a4b5f2d41f
- https://wgld.org/d/glsl/g009.html
- http://iquilezles.org/www/articles/distfunctions/distfunctions.htm
- https://ja.wikipedia.org/wiki/Constructive\_Solid\_Geometry
