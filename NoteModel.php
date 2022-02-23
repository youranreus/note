<?php

namespace App\Module\Note;

use App\Core\BaseModel;

class NoteModel extends BaseModel
{
    /**
     * @var string note id
     */
    private $id;

    /**
     * @var string note content
     */
    private $content;

    /**
     * @var string note key
     */
    private $key;

    /**
     * @var int db index
     */
    private $index;

    /**
     * 表名
     */
    private const TABLE = 'note';

    /**
     * @var bool modified?
     */
    private $modified;

    /**
     * constructor.
     */
    public function __construct($id)
    {
        parent::__construct();
        $this->id = $id;
        $this->modified = false;
        if (!$this->database->has(self::TABLE, ["sid" => $id])) {
            $this->database->insert("note", [
                "sid" => $id,
                "content" => "Begin your story.",
                "key" => ""
            ]);
            $this->content = "Begin your story.";
            $this->key = "";
            $this->index = $this->database->id();
        } else {
            $data = $this->database->get(self::TABLE, ["key", "content", "id"], ["sid" => $id]);
            $this->index = $data["id"];
            $this->content = $data["content"];
            $this->key = $data["key"];
        }
    }

    /**
     * 设置内容
     *
     * @param $content
     * User: youranreus
     * Date: 2021/12/23 14:00
     */
    public function setContent($content): void
    {
        $this->modified = !$this->modified ? $this->content != $content : $this->modified;
        $this->content = $content;
    }

    /**
     * 设置密钥
     *
     * @param $key
     * User: youranreus
     * Date: 2021/12/23 14:01
     */
    public function setKey($key): void
    {
        $this->modified = !$this->modified ? $this->key != $key : $this->modified;
        $this->key = $key;
    }

    /**
     * 获取内容
     *
     * @return string
     * User: youranreus
     * Date: 2021/12/23 14:02
     */
    public function getContent(): string
    {
        return $this->content;
    }

    /**
     * @return string
     */
    public function getKey(): string
    {
        return $this->key;
    }

    /**
     * 获取便签所有信息
     *
     * @return array
     * User: youranreus
     * Date: 2021/12/23 14:06
     */
    public function getAll(): array
    {
        return [
            "content" => $this->content,
            "key" => $this->key,
            "index" => $this->index,
            "lock" => $this->key != '',
            "id" => $this->id
        ];
    }

    /**
     * 更新信息
     *
     * @return bool
     * User: youranreus
     * Date: 2021/12/23 14:14
     */
    public function update(): bool
    {
        if (!$this->modified)
            return false;
        $result = $this->database->update(self::TABLE, ["content" => $this->content, "key" => $this->key], ["id" => $this->index]);
        $this->modified = false;
        return $result->rowCount() >= 1;
    }

    /**
     * 删除便签
     *
     * @return bool
     * User: youranreus
     * Date: 2021/12/23 14:26
     */
    public function delete(): bool
    {
        $result = $this->database->delete(self::TABLE, ["id" => $this->index]);
        return $result->rowCount() >= 1;
    }

}