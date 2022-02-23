<?php


namespace App\Module\Note;

use App\Conf\Conf;
use App\Core\BaseController;
use App\Core\HException;

class Note extends BaseController
{

    /**
     * @var NoteModel 便签模型对象
     */
    private $note;

    /**
     * Note constructor.
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * @return array|false
     * User: youranreus
     * Date: 2021/8/1 11:16
     */
    public function initDB()
    {
        return $this->database->query("
            CREATE TABLE IF NOT EXISTS `note` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
                  `key` text COLLATE utf8mb4_unicode_ci NOT NULL,
                  `sid` text COLLATE utf8mb4_unicode_ci NOT NULL,
                  PRIMARY KEY (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ")->fetchAll();
    }

    /**
     * @param $sid
     * @return array
     * User: youranreus
     * Date: 2021/7/25 19:42
     */
    public function getNote($sid): array
    {
        $this->note = new NoteModel($sid);
        return ["code" => 200, "content" => $this->note->getAll()];
    }

    /**
     * @param $sid
     * @return array
     * User: youranreus
     * Date: 2021/7/25 19:43
     */
    public function deleteNote($sid): array
    {
        $this->note = new NoteModel($sid);
        $data = $this->note->getAll();
        if ($data["lock"])
            try {
                $this->checkKey($data["key"]);
            } catch (HException $e) {
                $e->throwResponse($e->getCode());
            }

        return ["code" => 200, "content" => $this->note->delete() ? 1 : 0];
    }

    /**
     * @param $sid
     * @return array
     * User: youranreus
     * Date: 2021/7/25 19:43
     */
    public function modifyNote($sid): array
    {
        $this->note = new NoteModel($sid);
        $data = $this->note->getAll();
        if ($data["lock"])
            try {
                $this->checkKey($data["key"]);
            } catch (HException $e) {
                $e->throwResponse($e->getCode());
            }
        else
            $this->note->setKey($_GET['key']);

        if (!isset($_POST["content"]))
            return ["msg" => Conf::$msgOnParamMissing];

        $this->note->setContent($_POST['content']);

        return ["code" => 200, "content" => $this->note->update() ? 1 : 0];
    }

    /**
     * User: youranreus
     * Date: 2021/3/23 17:00
     * @param $key
     * @throws HException
     */
    private function checkKey($key)
    {
        if (!isset($_GET["key"]))
            throw new HException(Conf::$msgOnParamMissing,402);
        if ($key != $_GET["key"])
            throw new HException(Conf::$msgOnKeyError,401);
    }

}